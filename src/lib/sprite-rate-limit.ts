import { createHmac } from "crypto";

const getClientIp = (request: Request) => {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip");

  return forwarded?.split(",")[0]?.trim() || null;
};

export const getClientFingerprint = (request: Request) => {
  const ip = getClientIp(request);
  const secret = process.env.AUTH_SECRET;

  if (!ip || !secret) {
    return null;
  }

  return createHmac("sha256", secret).update(ip).digest("hex");
};
