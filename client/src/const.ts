export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getOrigin } from "@/lib/platform";

// Generate login URL at runtime so redirect URI reflects the current origin.
// In Capacitor WebView, window.location.origin is capacitor://localhost so we
// use getOrigin() which returns the production URL when running natively.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${getOrigin()}/api/oauth/callback`;
  const state = btoa(JSON.stringify({ origin: getOrigin(), returnPath: "/feed" }));

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
