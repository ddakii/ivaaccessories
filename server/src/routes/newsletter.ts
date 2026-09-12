import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { newsletterSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";

export const newsletterRouter = Router();

newsletterRouter.post("/", async (req, res, next) => {
  try {
    const body = newsletterSchema.parse(req.body);
    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: body.email.toLowerCase() },
      update: {},
      create: { email: body.email.toLowerCase() },
    });
    res.status(201).json(ok({ id: subscriber.id, email: subscriber.email }));
  } catch (error) {
    next(error);
  }
});

newsletterRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json(ok(subscribers));
  } catch (error) {
    next(error);
  }
});

newsletterRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.newsletterSubscriber.delete({ where: { id: req.params.id } });
    res.json(ok({ deleted: true }));
  } catch {
    next(new HttpError(404, "Subscriber not found"));
  }
});
