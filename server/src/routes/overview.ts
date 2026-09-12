import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/apiResponse.js";
import { requireAdmin } from "../middleware/auth.js";
import { money, moneyString } from "../lib/money.js";

export const overviewRouter = Router();
overviewRouter.use(requireAdmin);

overviewRouter.get("/", async (_req, res, next) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalProducts,
      lowStock,
      recentOrders,
      revenueOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "CONFIRMED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { items: true },
      }),
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" } },
        select: { total: true, createdAt: true, status: true },
      }),
    ]);

    const totalRevenue = revenueOrders.reduce((sum, order) => sum.plus(money(order.total)), money(0));
    const empty = totalOrders === 0;

    res.json(
      ok({
        totalOrders,
        pendingOrders,
        confirmedOrders,
        deliveredOrders,
        totalRevenue: moneyString(totalRevenue),
        totalProducts,
        lowStock,
        recentOrders,
        empty,
      })
    );
  } catch (error) {
    next(error);
  }
});
