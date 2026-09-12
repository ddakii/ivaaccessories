import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { ok } from "../lib/apiResponse.js";
import { requireAdmin } from "../middleware/auth.js";
import { settingsWriteSchema } from "../validation/schemas.js";
import { serializeDecimal } from "../lib/money.js";

export const settingsRouter = Router();

function serializeSettings(settings: {
  deliveryFee: unknown;
  freeDeliveryThreshold: unknown;
  whyShopBenefits: unknown;
  [key: string]: unknown;
}) {
  return {
    ...settings,
    deliveryFee: serializeDecimal(settings.deliveryFee),
    freeDeliveryThreshold: settings.freeDeliveryThreshold
      ? serializeDecimal(settings.freeDeliveryThreshold)
      : null,
    whyShopBenefits: settings.whyShopBenefits,
  };
}

settingsRouter.get("/", async (_req, res, next) => {
  try {
    const settings = await prisma.websiteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });
    res.json(ok(serializeSettings(settings)));
  } catch (error) {
    next(error);
  }
});

settingsRouter.put("/", requireAdmin, async (req, res, next) => {
  try {
    const body = settingsWriteSchema.parse(req.body);
    const settings = await prisma.websiteSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...body,
        deliveryFee: body.deliveryFee?.toFixed(2),
        freeDeliveryThreshold:
          body.freeDeliveryThreshold == null ? null : body.freeDeliveryThreshold.toFixed(2),
        whyShopBenefits: body.whyShopBenefits,
      },
      update: {
        ...body,
        deliveryFee: body.deliveryFee?.toFixed(2),
        freeDeliveryThreshold:
          body.freeDeliveryThreshold === undefined
            ? undefined
            : body.freeDeliveryThreshold == null
              ? null
              : body.freeDeliveryThreshold.toFixed(2),
        whyShopBenefits: body.whyShopBenefits,
      },
    });
    res.json(ok(serializeSettings(settings)));
  } catch (error) {
    next(error);
  }
});
