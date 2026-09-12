import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { checkoutSchema, orderStatusSchema, trackOrderSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import { orderLimiter } from "../middleware/rateLimit.js";
import { placeOrder, updateOrderStatus } from "../services/orderService.js";
import { serializeDecimal } from "../lib/money.js";

export const ordersRouter = Router();

function serializeOrder(order: Record<string, unknown>) {
  return {
    ...order,
    subtotal: serializeDecimal(order.subtotal),
    deliveryFee: serializeDecimal(order.deliveryFee),
    total: serializeDecimal(order.total),
  };
}

ordersRouter.post("/", orderLimiter, async (req, res, next) => {
  try {
    const body = checkoutSchema.parse(req.body);
    const order = await placeOrder({
      ...body,
      email: body.email || undefined,
    });
    const settings = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
    res.status(201).json(
      ok({
        ...serializeOrder(order),
        confirmationMessage: settings?.orderConfirmationMessage,
        deliveryInformation: settings?.deliveryInformation,
      })
    );
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/track", async (req, res, next) => {
  try {
    const body = trackOrderSchema.parse(req.body);
    const phone = body.phone.replace(/\s+/g, "");
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: body.orderNumber.trim().toUpperCase(),
        phone,
      },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw new HttpError(404, "Porosia nuk u gjet për këtë numër dhe telefon");
    const settings = await prisma.websiteSettings.findUnique({ where: { id: "default" } });
    res.json(
      ok({
        ...serializeOrder(order),
        deliveryInformation: settings?.deliveryInformation,
      })
    );
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const status = req.query.status ? String(req.query.status) : undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    const where: Prisma.OrderWhereInput = {};
    if (status) where.status = status as Prisma.OrderWhereInput["status"];
    if (from || to) {
      where.createdAt = {
        gte: from,
        lte: to,
      };
    }
    if (q) {
      where.OR = [
        { orderNumber: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, customer: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    res.json(ok(items.map(serializeOrder), { total, page, limit, totalPages: Math.ceil(total / limit) }));
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: { select: { slug: true } } } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        customer: true,
      },
    });
    if (!order) throw new HttpError(404, "Order not found");
    res.json(ok(serializeOrder(order)));
  } catch (error) {
    next(error);
  }
});

ordersRouter.patch("/:id/status", requireAdmin, async (req, res, next) => {
  try {
    const body = orderStatusSchema.parse(req.body);
    const order = await updateOrderStatus(req.params.id, body.status, body.note, body.internalNotes);
    res.json(ok(serializeOrder(order)));
  } catch (error) {
    next(error);
  }
});
