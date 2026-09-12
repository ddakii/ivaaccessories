import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok, HttpError } from "../lib/apiResponse.js";
import { categoryWriteSchema } from "../validation/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import { slugify } from "../lib/slug.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const categories = await prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    res.json(ok(categories));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const body = categoryWriteSchema.parse(req.body);
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: slugify(body.name),
        description: body.description,
        imageUrl: body.imageUrl ?? null,
        isActive: body.isActive,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    res.status(201).json(ok(category));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const body = categoryWriteSchema.parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: body.name,
        slug: slugify(body.name),
        description: body.description,
        imageUrl: body.imageUrl ?? null,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      },
    });
    res.json(ok(category));
  } catch (error) {
    next(error);
  }
});

categoriesRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const count = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (count > 0) throw new HttpError(400, "Remove or reassign products before deleting this category");
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json(ok({ deleted: true }));
  } catch (error) {
    next(error);
  }
});
