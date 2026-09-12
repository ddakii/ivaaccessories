import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export type JwtPayload = {
  sub: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
};

export function signAdminToken(payload: JwtPayload) {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export const COOKIE_NAME = "iva_admin_token";

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProd,
    sameSite: (env.isProd ? "none" : "lax") as "none" | "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}
