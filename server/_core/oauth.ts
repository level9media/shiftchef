import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string;
  phone_number?: string;
  name?: string;
} | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.users?.[0];
    if (!user) return null;
    return {
      uid: user.localId,
      phone_number: user.phoneNumber,
      name: user.displayName,
    };
  } catch (err) {
    console.error("[Firebase] Token verification error:", err);
    return null;
  }
}

export function registerOAuthRoutes(app: Express) {
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    const { idToken, name, phone } = req.body;

    if (!idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    try {
      const firebaseUser = await verifyFirebaseToken(idToken);
      if (!firebaseUser) {
        res.status(401).json({ error: "Invalid Firebase token" });
        return;
      }

      const openId = `firebase:${firebaseUser.uid}`;
      const phoneNumber = phone || firebaseUser.phone_number || null;
      const displayName = name || firebaseUser.name || null;

      // Upsert user — save name if provided
      await db.upsertUser({
        openId,
        name: displayName,
        email: null,
        loginMethod: "phone",
        lastSignedIn: new Date(),
      });

      // If phone provided, update that too
      if (phoneNumber) {
        const existing = await db.getUserByOpenId(openId);
        if (existing) {
          await db.updateUser(existing.id, { phone: phoneNumber });
        }
      }

      const user = await db.getUserByOpenId(openId);

      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName || phoneNumber || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({
        success: true,
        user: {
          id: user?.id,
          openId,
          name: displayName,
          phone: phoneNumber,
          userType: user?.userType,
          profileComplete: user?.profileComplete,
        },
      });
    } catch (err) {
      console.error("[Firebase Auth] Error:", err);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Save name after verification — called from Login name step
  app.post("/api/auth/set-name", async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    try {
      const user = await (await import("./sdk")).sdk.authenticateRequest(req);
      await db.updateUser(user.id, { name: name.trim() });
      res.json({ success: true });
    } catch (err) {
      console.error("[Set name] Error:", err);
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/?error=legacy_auth");
  });

  app.get("/api/auth/status", (_req: Request, res: Response) => {
    res.json({ status: "ok", auth: "firebase" });
  });
}
