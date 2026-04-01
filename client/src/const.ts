export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getOrigin, getOAuthRedirectUri, isCapacitor } from "@/lib/platform";

// Generate login URL at runtime so redirect URI reflects the current environment.
// - Browser: uses https://www.shiftchef.co/api/oauth/callback
// - Native Capacitor: uses shiftchef://oauth/callback (deep link)
export const getLoginUrl = (): string => {
  try {
    const oauthPortalUrl =
      import.meta.env.VITE_OAUTH_PORTAL_URL ?? "https://manus.im";
    const appId = import.meta.env.VITE_APP_ID ?? "";
    const redirectUri = getOAuthRedirectUri();

    // Encode origin + returnPath in state so the server knows where to redirect after login.
    // Use a safe btoa fallback — btoa throws on non-latin1 chars on some iOS WKWebViews.
    const stateObj = JSON.stringify({
      origin: getOrigin(),
      returnPath: "/feed",
      native: isCapacitor(),
    });
    const state = (() => {
      try {
        return btoa(stateObj);
      } catch {
        // Fallback: percent-encode first so all chars are latin1-safe
        return btoa(encodeURIComponent(stateObj));
      }
    })();

    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (err) {
    console.error("[getLoginUrl] Failed to build login URL:", err);
    // Fallback: let the server handle auth via the home page
    return "/";
  }
};
