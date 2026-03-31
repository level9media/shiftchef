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
export const PRODUCTION_API_BASE = "https://www.shiftchef.co";

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
 * Custom URL scheme for deep links.
 * iOS must have CFBundleURLSchemes = ["shiftchef"] in Info.plist.
 */
export const DEEP_LINK_SCHEME = "shiftchef";

/**
 * The redirect URI used for OAuth in native Capacitor builds.
 * The server will redirect to this URL after login, and the Capacitor
 * App plugin will intercept it and handle the session token.
 */
export const NATIVE_OAUTH_REDIRECT_URI = `${DEEP_LINK_SCHEME}://oauth/callback`;

/**
 * Returns the correct OAuth redirect URI for the current environment.
 * - Browser: https://www.shiftchef.co/api/oauth/callback
 * - Native: shiftchef://oauth/callback
 */
export const getOAuthRedirectUri = (): string => {
  if (isCapacitor()) {
    return NATIVE_OAUTH_REDIRECT_URI;
  }
  return `${getOrigin()}/api/oauth/callback`;
};
