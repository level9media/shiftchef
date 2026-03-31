/**
 * Deep Link Handler for Capacitor iOS
 *
 * Flow:
 * 1. User taps "Sign In" → opens Safari/SFSafariViewController with OAuth URL
 *    (redirectUri = shiftchef://oauth/callback)
 * 2. After login, OAuth server redirects to:
 *    https://www.shiftchef.co/api/oauth/callback?code=...&state=...
 * 3. Server exchanges code for token, creates session cookie, then redirects to:
 *    shiftchef://oauth/callback?token=<sessionToken>
 * 4. iOS intercepts shiftchef:// URL, fires appUrlOpen event
 * 5. This handler extracts the token and stores it as a cookie, then navigates to /feed
 */

import { App } from "@capacitor/app";
import { isCapacitor, DEEP_LINK_SCHEME, PRODUCTION_API_BASE } from "./platform";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Set a cookie in the WebView (mirrors what the server sets via Set-Cookie).
 * In Capacitor, cookies set by fetch responses with credentials:include are
 * accessible, but we also need to handle the deep link token path.
 */
function setSessionCookie(token: string) {
  const expires = new Date(Date.now() + ONE_YEAR_MS).toUTCString();
  // Set for the capacitor://localhost origin (WebView origin)
  document.cookie = `${COOKIE_NAME}=${token}; expires=${expires}; path=/; SameSite=None; Secure`;
}

/**
 * Handle an incoming deep link URL.
 * Expected format: shiftchef://oauth/callback?token=<sessionToken>
 */
function handleDeepLink(url: string) {
  console.log("[DeepLink] Received URL:", url);

  try {
    // Replace custom scheme with https for URL parsing
    const parseable = url.replace(`${DEEP_LINK_SCHEME}://`, "https://shiftchef.co/");
    const parsed = new URL(parseable);

    if (parsed.pathname === "/oauth/callback") {
      const token = parsed.searchParams.get("token");
      if (token) {
        console.log("[DeepLink] OAuth callback received, setting session cookie");
        setSessionCookie(token);
        // Navigate to feed — React Router will pick this up
        window.location.href = "/feed";
        return;
      }

      const error = parsed.searchParams.get("error");
      if (error) {
        console.error("[DeepLink] OAuth error:", error);
        window.location.href = "/?error=auth_failed";
        return;
      }
    }

    console.warn("[DeepLink] Unhandled deep link path:", parsed.pathname);
  } catch (err) {
    console.error("[DeepLink] Failed to parse URL:", url, err);
  }
}

/**
 * Initialize the deep link listener.
 * Call this once at app startup (in main.tsx).
 * No-op in browser environment.
 */
export function initDeepLinkHandler() {
  if (!isCapacitor()) return;

  // Handle URLs that opened the app from a cold start
  App.getLaunchUrl().then(result => {
    if (result?.url) {
      console.log("[DeepLink] Launch URL:", result.url);
      handleDeepLink(result.url);
    }
  });

  // Handle URLs when app is already running (warm start / foreground)
  App.addListener("appUrlOpen", event => {
    console.log("[DeepLink] appUrlOpen:", event.url);
    handleDeepLink(event.url);
  });

  console.log("[DeepLink] Handler initialized for scheme:", DEEP_LINK_SCHEME);
}
