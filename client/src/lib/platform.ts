// platform.ts v2 — exports: isNative, isCapacitor, getApiBase, getOrigin, getOAuthRedirectUri
/**
 * Detect whether the app is running inside a Capacitor native WebView.
 * In Capacitor, window.location.origin is "capacitor://localhost" (iOS)
 * or "http://localhost" (Android), not the real production domain.
 */
export const isNative = (): boolean => {
  return (
    typeof window !== "undefined" &&
    (window.location.origin.startsWith("capacitor://") ||
      (window.location.origin === "http://localhost" &&
        typeof (window as any).Capacitor !== "undefined"))
  );
};

/** @deprecated Use isNative() instead */
export const isCapacitor = (): boolean => {
  return (
    typeof window !== "undefined" &&
    (window.location.origin.startsWith("capacitor://") ||
      (window.location.origin === "http://localhost" &&
        typeof (window as any).Capacitor !== "undefined"))
  );
};

/**
 * The production API base URL.
 * In Capacitor WebView, all API calls must use the absolute URL because
 * relative paths resolve to capacitor://localhost/api/... which doesn't exist.
 */
export const PRODUCTION_API_BASE = "https://shiftchef-production.up.railway.app";

/**
 * Returns the correct API base URL depending on the runtime environment.
 * - Browser (web): empty string → relative URLs like /api/trpc work fine
 * - Capacitor native: absolute production URL
 */
export const getApiBase = (): string => {
  if (isCapacitor()) {
    return PRODUCTION_API_BASE;
  }
  return "";
};

/**
 * Returns the correct origin for OAuth redirects.
 * In Capacitor, window.location.origin is capacitor://localhost which
 * the OAuth server won't accept. Use the production URL instead.
 */
export const getOrigin = (): string => {
  if (isCapacitor()) {
    return PRODUCTION_API_BASE;
  }
  return window.location.origin;
};

/**
 * Custom URL scheme for deep links (kept for legacy Info.plist, not used for OAuth).
 */
export const DEEP_LINK_SCHEME = "shiftchef";

/**
 * The HTTPS redirect URI used for OAuth in native Capacitor builds.
 * Manus OAuth only permits http://, https://, or manus* schemes.
 * The server receives the callback at this URL, sets the session cookie,
 * then redirects the browser back into the app via /feed.
 */
export const NATIVE_OAUTH_REDIRECT_URI = `${PRODUCTION_API_BASE}/api/oauth/callback`;

/**
 * Returns the correct OAuth redirect URI for the current environment.
 * Both web and native use the same HTTPS callback URL — the server
 * detects native mode from the state parameter and handles accordingly.
 */
export const getOAuthRedirectUri = (): string => {
  if (isCapacitor()) {
    return NATIVE_OAUTH_REDIRECT_URI;
  }
  return `${getOrigin()}/api/oauth/callback`;
};
