import type { IncomingMessage, ServerResponse } from "node:http";
import { catalogProducts } from "../prisma/catalog";

const now = "2026-09-11T17:16:00.000Z";

const categories = [
  {
    id: "bags",
    name: "Çanta",
    slug: "bags",
    description: "Çanta me dorezë, flap të qepura dhe crossbody për çdo ditë.",
    imageUrl: "/uploads/products/bag-quilted-black.png",
    isActive: true,
    sortOrder: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "sunglasses",
    name: "Syze",
    slug: "sunglasses",
    description: "Korniza të rafinuara, të zgjedhura për formë dhe përdorim të përditshëm.",
    imageUrl: "/uploads/products/sunglasses-rimless.png",
    isActive: true,
    sortOrder: 2,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "wallets",
    name: "Portofola",
    slug: "wallets",
    description: "Portofola dhe mbajtëse kartash kompakte, me përfundim të pastër.",
    imageUrl: "/uploads/products/bag-structured-beige.png",
    isActive: true,
    sortOrder: 3,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "jewelry",
    name: "Bizhuteri",
    slug: "jewelry",
    description: "Varëse, byzylykë dhe vathë për të përfunduar look-un.",
    imageUrl: "/uploads/products/jewelry-pearl-choker.png",
    isActive: true,
    sortOrder: 4,
    createdAt: now,
    updatedAt: now,
  },
];

function productFromCatalog(item: (typeof catalogProducts)[number]) {
  const category = categories.find((entry) => entry.slug === item.category) ?? categories[0];
  return {
    id: item.slug,
    name: item.name,
    slug: item.slug,
    description: item.description,
    sku: item.sku,
    price: item.price,
    salePrice: item.salePrice ?? null,
    categoryId: category.id,
    gender: item.gender,
    stock: item.stock,
    colors: item.colors,
    sizes: [],
    isFeatured: Boolean(item.featured),
    isActive: true,
    isNewArrival: Boolean(item.newArrival),
    salesCount: 0,
    createdAt: now,
    updatedAt: now,
    category: { ...category, _count: { products: catalogProducts.filter((p) => p.category === category.slug).length } },
    images: [
      {
        id: `${item.slug}-img`,
        productId: item.slug,
        url: `/uploads/products/${item.image}`,
        alt: item.name,
        sortOrder: 0,
      },
    ],
  };
}

const products = catalogProducts.map(productFromCatalog);

function json(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function ok(data: unknown, meta?: unknown) {
  return meta ? { success: true, data, meta } : { success: true, data };
}

export function tryOfflineApi(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method !== "GET") return false;

  if (url.pathname === "/api/settings") {
    json(
      res,
      200,
      ok({
        id: "default",
        storeName: "IVA Accessories",
        storeLogo: null,
        heroImageUrl: "/uploads/products/jewelry-pearl-choker.png",
        promoBannerImage: "/uploads/products/bag-structured-orange.png",
        storeEmail: "hello@ivaaccessories.com",
        storePhone: "",
        deliveryFee: "3.00",
        freeDeliveryThreshold: "80.00",
        announcementBarText: "Dorëzim falas për porosi të zgjedhura. Pagesë në dorëzim.",
        footerText: "IVA Accessories. Çanta, syze dhe portofola të përzgjedhura me kujdes.",
        heroHeadline: "Aksesorë që përcaktojnë stilin tuaj.",
        heroSubheadline: "Një koleksion i përzgjedhur çantash, syzesh dhe portofolash — për çdo ditë.",
        promoBannerTitle: "Përzgjedhja e re",
        promoBannerText: "Zbuloni çanta të strukturuara, syze të rafinuara dhe portofola kompakte për gardërobën moderne.",
        promoBannerCta: "Shiko koleksionin",
        whyShopBenefits: [
          { title: "Aksesorë të përzgjedhur", description: "Çdo copë zgjidhet për materialin, formën dhe përdorimin e përditshëm." },
          { title: "Porosi e lehtë", description: "Shfletoni, shtoni në çantë dhe porositni me disa hapa — pa llogari." },
          { title: "Pagesë në dorëzim", description: "Paguani kur t'ju vijë porosia. E thjeshtë dhe e qartë." },
          { title: "Mbështetje për klientët", description: "Pyetje për madhësinë, stokun ose një porosi? Jemi këtu." },
        ],
      })
    );
    return true;
  }

  if (url.pathname === "/api/categories") {
    json(
      res,
      200,
      ok(
        categories.map((category) => ({
          ...category,
          _count: { products: catalogProducts.filter((item) => item.category === category.slug).length },
        }))
      )
    );
    return true;
  }

  if (url.pathname === "/api/products") {
    const featured = url.searchParams.get("featured") === "true";
    const category = url.searchParams.get("category");
    const gender = url.searchParams.get("gender");
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = Number(url.searchParams.get("limit") ?? 12);
    const sort = url.searchParams.get("sort") ?? "newest";

    let items = [...products];
    if (featured) items = items.filter((item) => item.isFeatured);
    if (category) items = items.filter((item) => item.category.slug === category);
    if (gender) items = items.filter((item) => item.gender === gender);
    if (q) items = items.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
    if (sort === "price_asc") items.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price_desc") items.sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "featured") items.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);
    json(res, 200, ok(paged, { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) }));
    return true;
  }

  const slugMatch = url.pathname.match(/^\/api\/products\/slug\/([^/]+)$/);
  if (slugMatch) {
    const product = products.find((item) => item.slug === slugMatch[1]);
    if (!product) {
      json(res, 404, { success: false, error: "Product not found" });
      return true;
    }
    const related = products.filter((item) => item.slug !== product.slug && item.categoryId === product.categoryId).slice(0, 4);
    json(res, 200, ok({ product, related }));
    return true;
  }

  return false;
}
