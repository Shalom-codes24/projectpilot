import { createNeonAuth } from "@neondatabase/auth/next/server";

let authInstance;

export function getAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl || !cookieSecret) {
    throw new Error("Set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET to enable accounts.");
  }

  if (!authInstance) {
    authInstance = createNeonAuth({
      baseUrl,
      cookies: { secret: cookieSecret }
    });
  }

  return authInstance;
}
