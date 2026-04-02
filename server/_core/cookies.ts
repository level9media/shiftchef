import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // In production (Railway) always use secure — Railway is always HTTPS
  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction ? true : isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure,
  };
}
