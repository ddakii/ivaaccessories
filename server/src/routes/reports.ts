import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/apiResponse.js";
import { requireAdmin } from "../middleware/auth.js";
import { money, moneyString } from "../lib/money.js";

export const reportsRouter = Router();
reportsRouter.use(requireAdmin);

function rangeFromQuery(query: Record<string, unknown>) {
  const preset = String(query.preset ?? "month");
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);
  if (preset === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (preset === "week") {
    const day = from.getDay() || 7;
    from.setDate(from.getDate() - day + 1);
    from.setHours(0, 0, 0, 0);
  } else if (preset === "month") {
    from = new Date(from.getFullYear(), from.getMonth(), 1);
  } else if (preset === "year") {
    from = new Date(from.getFullYear(), 0, 1);
  } else if (preset === "custom") {
    from = query.from ? new Date(String(query.from)) : from;
    to = query.to ? new Date(String(query.to)) : to;
  }
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

reportsRouter.get("/sales", async (req, res, next) => {
  try {
    const { from, to } = rangeFromQuery(req.query as Record<string, unknown>);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { items: { include: { product: { include: { category: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    const delivered = orders.filter((order) => order.status === "DELIVERED");
    const cancelled = orders.filter((order) => order.status === "CANCELLED");
    const revenueOrders = orders.filter((order) => order.status !== "CANCELLED");
    const revenue = revenueOrders.reduce((sum, order) => sum.plus(money(order.total)), money(0));
    const average = revenueOrders.length ? revenue.div(revenueOrders.length) : money(0);

    const byDay = new Map<string, { orders: number; revenue: number }>();
    for (const order of revenueOrders) {
      const key = order.createdAt.toISOString().slice(0, 10);
      const current = byDay.get(key) ?? { orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += Number(order.total);
      byDay.set(key, current);
    }

    const categoryMap = new Map<string, number>();
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of revenueOrders) {
      for (const item of order.items) {
        const categoryName = item.product.category.name;
        categoryMap.set(
          categoryName,
          (categoryMap.get(categoryName) ?? 0) + Number(item.unitPrice) * item.quantity
        );
        const current = productMap.get(item.productId) ?? {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
        current.quantity += item.quantity;
        current.revenue += Number(item.unitPrice) * item.quantity;
        productMap.set(item.productId, current);
      }
    }

    res.json(
      ok({
        from,
        to,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        cancelledOrders: cancelled.length,
        totalRevenue: moneyString(revenue),
        averageOrderValue: moneyString(average),
        salesOverTime: [...byDay.entries()].map(([date, value]) => ({ date, ...value })),
        revenueByCategory: [...categoryMap.entries()].map(([category, amount]) => ({
          category,
          amount,
        })),
        bestSelling: [...productMap.values()]
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 8),
        empty: orders.length === 0,
      })
    );
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/export/orders.csv", async (req, res, next) => {
  try {
    const { from, to } = rangeFromQuery(req.query as Record<string, unknown>);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const header = [
      "Order Number",
      "Date",
      "Customer",
      "Phone",
      "Email",
      "City",
      "Status",
      "Payment",
      "Subtotal",
      "Delivery",
      "Total",
      "Items",
    ];
    const rows = orders.map((order) =>
      [
        order.orderNumber,
        order.createdAt.toISOString(),
        order.fullName,
        order.phone,
        order.email ?? "",
        order.city,
        order.status,
        order.paymentMethod,
        moneyString(order.subtotal),
        moneyString(order.deliveryFee),
        moneyString(order.total),
        order.items.map((item) => `${item.productName} x${item.quantity}`).join("; "),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=iva-orders.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

reportsRouter.get("/export/sales.csv", async (req, res, next) => {
  try {
    const { from, to } = rangeFromQuery(req.query as Record<string, unknown>);
    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: "CANCELLED" } },
    });
    const revenue = orders.reduce((sum, order) => sum.plus(money(order.total)), money(0));
    const csv = [
      "Metric,Value",
      `From,${from.toISOString()}`,
      `To,${to.toISOString()}`,
      `Orders,${orders.length}`,
      `Revenue,${moneyString(revenue)}`,
    ].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=iva-sales-report.csv");
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
