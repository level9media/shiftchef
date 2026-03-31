export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getOrigin, getOAuthRedirectUri, isCapacitor } from "@/lib/platform";

// Generate login URL at runtime so redirect URI reflects the current environment.
// - Browser: uses https://www.shiftchef.co/api/oauth/callback
// - Native Capacitor: uses shiftchef://oauth/callback (deep link)
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = getOAuthRedirectUri();
  // Encode origin + returnPath in state so the server knows where to redirect after login
  const state = btoa(JSON.stringify({
    origin: getOrigin(),
    returnPath: "/feed",
    native: isCapacitor(),
  }));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
