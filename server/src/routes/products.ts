import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { productFilterSchema, productWriteSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import { slugify } from "../lib/slug.js";
import { serializeDecimal } from "../lib/money.js";
import { recordInventoryChange } from "../services/inventoryService.js";
import { COOKIE_NAME } from "../lib/jwt.js";

export const productsRouter = Router();

function serializeProduct(product: {
  price: unknown;
  salePrice: unknown;
  createdAt: Date;
  [key: string]: unknown;
}) {
  return {
    ...product,
    price: serializeDecimal(product.price),
    salePrice: product.salePrice ? serializeDecimal(product.salePrice) : null,
    createdAt: product.createdAt.toISOString(),
  };
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const query = productFilterSchema.parse(req.query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const where: Prisma.ProductWhereInput = {};
    const isAdmin = Boolean(req.cookies?.[COOKIE_NAME] || req.headers.authorization);
    if (!(query.includeInactive && isAdmin)) where.isActive = true;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { sku: { contains: query.q, mode: "insensitive" } },
        { description: { contains: query.q, mode: "insensitive" } },
      ];
    }
    if (query.category) {
      where.category = { slug: query.category };
    }
    if (query.gender) where.gender = query.gender;
    if (query.featured) where.isFeatured = true;
    if (query.minPrice != null || query.maxPrice != null) {
      where.OR = undefined;
      where.AND = [
        query.q
          ? {
              OR: [
                { name: { contains: query.q, mode: "insensitive" } },
                { sku: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {},
        query.minPrice != null || query.maxPrice != null
          ? {
              price: {
                gte: query.minPrice,
                lte: query.maxPrice,
              },
            }
          : {},
      ];
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sort === "price_asc") orderBy = { price: "asc" };
    if (query.sort === "price_desc") orderBy = { price: "desc" };
    if (query.sort === "featured") orderBy = { isFeatured: "desc" };
    if (query.sort === "best_selling") orderBy = { salesCount: "desc" };
    if (query.sort === "newest") orderBy = { createdAt: "desc" };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json(
      ok(items.map(serializeProduct), {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/slug/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) throw new HttpError(404, "Product not found");
    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        OR: [{ categoryId: product.categoryId }, { gender: product.gender }],
      },
      include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      take: 4,
    });
    res.json(ok({ product: serializeProduct(product), related: related.map(serializeProduct) }));
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:id", requireAdmin, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    });
    if (!product) throw new HttpError(404, "Product not found");
    res.json(ok(serializeProduct(product)));
  } catch (error) {
    next(error);
  }
});

productsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = productWriteSchema.parse(req.body);
    const slug = slugify(body.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: finalSlug,
        description: body.description,
        sku: body.sku,
        price: body.price.toFixed(2),
        salePrice: body.salePrice ? body.salePrice.toFixed(2) : null,
        categoryId: body.categoryId,
        gender: body.gender,
        stock: body.stock,
        colors: body.colors,
        sizes: body.sizes,
        isFeatured: body.isFeatured,
        isActive: body.isActive,
        isNewArrival: body.isNewArrival,
        images: {
          create: body.images.map((image, index) => ({
            url: image.url,
            alt: image.alt ?? body.name,
            sortOrder: image.sortOrder ?? index,
          })),
        },
      },
      include: { category: true, images: true },
    });
    await recordInventoryChange({
      productId: product.id,
      previousQuantity: 0,
      newQuantity: product.stock,
      reason: "Product created",
      adminUserId: req.admin?.id,
    });
    res.status(201).json(ok(serializeProduct(product)));
  } catch (error) {
    next(error);
  }
});

productsRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = productWriteSchema.parse(req.body);
    const current = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!current) throw new HttpError(404, "Product not found");
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        slug: slugify(body.name) === current.slug ? current.slug : slugify(body.name),
        description: body.description,
        sku: body.sku,
        price: body.price.toFixed(2),
        salePrice: body.salePrice ? body.salePrice.toFixed(2) : null,
        categoryId: body.categoryId,
        gender: body.gender,
        stock: body.stock,
        colors: body.colors,
        sizes: body.sizes,
        isFeatured: body.isFeatured,
        isActive: body.isActive,
        isNewArrival: body.isNewArrival,
        images: {
          deleteMany: {},
          create: body.images.map((image, index) => ({
            url: image.url,
            alt: image.alt ?? body.name,
            sortOrder: image.sortOrder ?? index,
          })),
        },
      },
      include: { category: true, images: true },
    });
    if (current.stock !== body.stock) {
      await recordInventoryChange({
        productId: product.id,
        previousQuantity: current.stock,
        newQuantity: body.stock,
        reason: "Product updated",
        adminUserId: req.admin?.id,
      });
    }
    res.json(ok(serializeProduct(product)));
  } catch (error) {
    next(error);
  }
});

productsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { orderItems: { take: 1 } },
    });
    if (!product) throw new HttpError(404, "Product not found");
    if (product.orderItems.length > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: { isActive: false },
      });
      return res.json(ok({ archived: true }));
    }
    await prisma.product.delete({ where: { id: product.id } });
    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
