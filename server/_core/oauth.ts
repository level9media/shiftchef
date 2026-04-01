import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Native Capacitor apps now use HTTPS redirect URI (shiftchef:// is blocked by Manus OAuth).
// After login, we set the session cookie and redirect to /feed — the Capacitor WebView
// picks up the cookie automatically since it loads from https://www.shiftchef.co.
const NATIVE_POST_LOGIN_PATH = "/feed";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Parse the state parameter to detect native Capacitor login.
 * State is base64-encoded JSON: { origin, returnPath, native? }
 * Legacy format was just the redirect URI — treat as web.
 */
function parseState(state: string): { origin?: string; returnPath?: string; native?: boolean } {
  try {
    return JSON.parse(Buffer.from(state, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const parsedState = parseState(state);

      if (parsedState.native) {
        // Native Capacitor flow: set session cookie and redirect to /feed.
        // The Capacitor WebView loads from https://www.shiftchef.co so the cookie
        // is set on the correct domain and the app picks it up automatically.
        console.log("[OAuth] Native login — setting cookie and redirecting to feed");
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        res.redirect(302, NATIVE_POST_LOGIN_PATH);
      } else {
        // Web browser flow: set session cookie and redirect to app.
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        const returnPath = parsedState.returnPath || "/";
        res.redirect(302, returnPath);
      }
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
