import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { requireAdmin } from "../middleware/auth.js";
import { moneyString } from "../lib/money.js";

export const customersRouter = Router();

customersRouter.use(requireAdmin);

customersRouter.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const where: Prisma.CustomerWhereInput = q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        include: {
          orders: { select: { total: true, createdAt: true, orderNumber: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = customers.map((customer) => {
      const spending = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
      const lastOrder = customer.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        city: customer.city,
        address: customer.address,
        totalOrders: customer.orders.length,
        totalSpending: moneyString(spending),
        lastOrderDate: lastOrder?.createdAt ?? null,
        lastOrderNumber: lastOrder?.orderNumber ?? null,
      };
    });

    res.json(ok(data, { total, page, limit, totalPages: Math.ceil(total / limit) }));
  } catch (error) {
    next(error);
  }
});

customersRouter.get("/:id", async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        orders: {
          include: { items: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!customer) throw new HttpError(404, "Customer not found");
    const totalSpending = customer.orders.reduce((sum, order) => sum + Number(order.total), 0);
    res.json(
      ok({
        ...customer,
        totalOrders: customer.orders.length,
        totalSpending: moneyString(totalSpending),
      })
    );
  } catch (error) {
    next(error);
  }
});
