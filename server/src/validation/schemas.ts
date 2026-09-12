import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const productFilterSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  gender: z.enum(["WOMEN", "MEN", "UNISEX"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "featured", "best_selling"]).optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(48).optional(),
  includeInactive: z.coerce.boolean().optional(),
});

export const productWriteSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  sku: z.string().min(2),
  price: z.coerce.number().positive(),
  salePrice: z.union([z.coerce.number().positive(), z.null()]).optional(),
  categoryId: z.string().min(1),
  gender: z.enum(["WOMEN", "MEN", "UNISEX"]),
  stock: z.coerce.number().int().min(0),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  isNewArrival: z.boolean().optional().default(false),
  images: z
    .array(z.object({ url: z.string().min(1), alt: z.string().nullable().optional(), sortOrder: z.number().optional() }))
    .optional()
    .default([]),
});

export const categoryWriteSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(""),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().optional(),
});

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Vendosni një numër telefoni të vlefshëm")
  .max(20)
  .regex(/^[+\d][\d\s().-]{7,19}$/, "Vendosni një numër telefoni të vlefshëm");

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Emri i plotë është i detyrueshëm"),
  phone: phoneSchema,
  email: z.union([z.string().email(), z.literal("")]).optional(),
  city: z.string().trim().min(2, "Qyteti është i detyrueshëm"),
  address: z.string().trim().min(5, "Adresa është e detyrueshme"),
  addressDetails: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.literal("COD"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        color: z.string().optional(),
        size: z.string().optional(),
      })
    )
    .min(1, "Çanta juaj është bosh"),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(3),
  phone: phoneSchema,
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const inventoryUpdateSchema = z.object({
  quantity: z.number().int().min(0),
  reason: z.string().min(2),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const adminUserWriteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
});

export const settingsWriteSchema = z.object({
  storeName: z.string().optional(),
  storeLogo: z.string().nullable().optional(),
  storeEmail: z.string().optional(),
  storePhone: z.string().optional(),
  storeAddress: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
  freeDeliveryThreshold: z.union([z.coerce.number().min(0), z.null()]).optional(),
  announcementBarText: z.string().optional(),
  announcementBarEnabled: z.boolean().optional(),
  footerText: z.string().optional(),
  contactInformation: z.string().optional(),
  orderConfirmationMessage: z.string().optional(),
  deliveryInformation: z.string().optional(),
  heroHeadline: z.string().optional(),
  heroSubheadline: z.string().optional(),
  heroImageUrl: z.string().nullable().optional(),
  promoBannerTitle: z.string().optional(),
  promoBannerText: z.string().optional(),
  promoBannerCta: z.string().optional(),
  promoBannerImage: z.string().nullable().optional(),
  whyShopBenefits: z
    .array(z.object({ title: z.string(), description: z.string() }))
    .optional(),
});
