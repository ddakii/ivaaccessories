import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { ok, fail, HttpError } from "../lib/apiResponse.js";
import { cookieOptions, COOKIE_NAME, signAdminToken } from "../lib/jwt.js";
import { loginSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import { loginLimiter } from "../middleware/rateLimit.js";

export const authRouter = Router();

authRouter.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.adminUser.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !user.isActive) throw new HttpError(401, "Invalid email or password");
    const match = await bcrypt.compare(body.password, user.passwordHash);
    if (!match) throw new HttpError(401, "Invalid email or password");

    const token = signAdminToken({ sub: user.id, email: user.email, role: user.role });
    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json(
      ok({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
    );
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: 0 });
  res.json(ok({ loggedOut: true }));
});

authRouter.get("/me", requireAdmin, async (req, res) => {
  res.json(ok(req.admin));
});

authRouter.patch("/profile", requireAdmin, async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const password = req.body.password ? String(req.body.password) : "";
    if (name.length < 2) throw new HttpError(400, "Name is required");
    const data: { name: string; passwordHash?: string } = { name };
    if (password) {
      if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters");
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    const user = await prisma.adminUser.update({
      where: { id: req.admin!.id },
      data,
      select: { id: true, email: true, name: true, role: true },
    });
    res.json(ok(user));
  } catch (error) {
    next(error);
  }
});
