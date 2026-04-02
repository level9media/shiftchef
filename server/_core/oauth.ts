import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

// Verify Firebase ID token using Firebase Admin REST API
async function verifyFirebaseToken(idToken: string): Promise<{
  uid: string;
  phone_number?: string;
  name?: string;
} | null> {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || "shiftchef-c9854";
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) {
      console.warn("[Firebase] Token lookup failed:", res.status);
      return null;
    }
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
  // Firebase phone auth callback — called from frontend after phone verification
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    const { idToken, name, phone } = req.body;

    if (!idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    try {
      // Verify the Firebase token
      const firebaseUser = await verifyFirebaseToken(idToken);
      if (!firebaseUser) {
        res.status(401).json({ error: "Invalid Firebase token" });
        return;
      }

      const openId = `firebase:${firebaseUser.uid}`;
      const phoneNumber = phone || firebaseUser.phone_number || null;
      const displayName = name || null;

      // Upsert user in DB
      await db.upsertUser({
        openId,
        name: displayName,
        email: null,
        loginMethod: "phone",
        lastSignedIn: new Date(),
        ...(phoneNumber ? { phone: phoneNumber } : {}),
      });

      const user = await db.getUserByOpenId(openId);

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: displayName || phoneNumber || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set session cookie
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
          verificationStatus: user?.verificationStatus,
        },
      });
    } catch (err) {
      console.error("[Firebase Auth] Error:", err);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Legacy OAuth callback — redirect to home with error
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect("/?error=legacy_auth");
  });

  // Health check
  app.get("/api/auth/status", (req: Request, res: Response) => {
    res.json({ status: "ok", auth: "firebase" });
  });
}
