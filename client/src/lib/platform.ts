/**
 * Detect whether the app is running inside a Capacitor native WebView.
 * In Capacitor, window.location.origin is "capacitor://localhost" (iOS)
 * or "http://localhost" (Android), not the real production domain.
 */
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
