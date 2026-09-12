import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { requireAdmin } from "../middleware/auth.js";
import { inventoryUpdateSchema } from "../validation/schemas.js";
import { setStock } from "../services/inventoryService.js";
import { serializeDecimal } from "../lib/money.js";

export const inventoryRouter = Router();
inventoryRouter.use(requireAdmin);

inventoryRouter.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const filter = String(req.query.filter ?? "all");
    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }
    if (filter === "low") where.stock = { lte: 5, gt: 0 };
    if (filter === "out") where.stock = { lte: 0 };

    const products = await prisma.product.findMany({
      where,
      include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
      orderBy: { stock: "asc" },
    });
    res.json(
      ok(
        products.map((product) => ({
          ...product,
          price: serializeDecimal(product.price),
          status: product.stock <= 0 ? "out" : product.stock <= 5 ? "low" : "ok",
        }))
      )
    );
  } catch (error) {
    next(error);
  }
});

inventoryRouter.get("/history", async (req, res, next) => {
  try {
    const productId = req.query.productId ? String(req.query.productId) : undefined;
    const history = await prisma.inventoryMovement.findMany({
      where: productId ? { productId } : undefined,
      include: {
        product: { select: { name: true, sku: true } },
        adminUser: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(ok(history));
  } catch (error) {
    next(error);
  }
});

inventoryRouter.patch("/:productId", async (req, res, next) => {
  try {
    const body = inventoryUpdateSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) throw new HttpError(404, "Product not found");
    await setStock(product.id, body.quantity, body.reason, req.admin?.id);
    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    res.json(ok(updated));
  } catch (error) {
    next(error);
  }
});
