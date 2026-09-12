import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { requireAdmin, requireRole } from "../middleware/auth.js";
import { adminUserWriteSchema } from "../validation/schemas.js";

export const adminUsersRouter = Router();
adminUsersRouter.use(requireAdmin, requireRole("SUPER_ADMIN"));

adminUsersRouter.get("/", async (_req, res, next) => {
  try {
    const users = await prisma.adminUser.findMany({
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(ok(users));
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.post("/", async (req, res, next) => {
  try {
    const body = adminUserWriteSchema.parse(req.body);
    if (!body.password) throw new HttpError(400, "Password is required");
    const user = await prisma.adminUser.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash: await bcrypt.hash(body.password, 12),
        role: body.role ?? "ADMIN",
      },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    res.status(201).json(ok(user));
  } catch (error) {
    next(error);
  }
});

adminUsersRouter.put("/:id", async (req, res, next) => {
  try {
    const body = adminUserWriteSchema.parse(req.body);
    const data: Record<string, unknown> = {
      name: body.name,
      email: body.email.toLowerCase(),
      role: body.role,
      isActive: body.isActive,
    };
    if (body.password) data.passwordHash = await bcrypt.hash(body.password, 12);
    const user = await prisma.adminUser.update({
      where: { id: req.params.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    res.json(ok(user));
  } catch (error) {
    next(error);
  }
});
