import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { COOKIE_NAME, verifyAdminToken } from "../lib/jwt.js";
import { fail, HttpError } from "../lib/apiResponse.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = req.cookies?.[COOKIE_NAME] || bearer;
    if (!token) throw new HttpError(401, "Authentication required");

    const payload = verifyAdminToken(token);
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid session");

    req.admin = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json(fail(error.message));
    }
    return res.status(401).json(fail("Invalid or expired session"));
  }
}

export function requireRole(...roles: Array<"SUPER_ADMIN" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) return res.status(401).json(fail("Authentication required"));
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json(fail("You do not have permission to do this"));
    }
    next();
  };
}
