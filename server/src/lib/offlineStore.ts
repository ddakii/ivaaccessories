import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const now = "2026-09-11T17:16:00.000Z";

type CatalogProduct = {
  name: string;
  slug: string;
  description: string;
  sku: string;
  price: string;
  salePrice?: string;
  category: string;
  gender: "WOMEN" | "MEN" | "UNISEX";
  stock: number;
  colors: string[];
  featured?: boolean;
  newArrival?: boolean;
  image: string;
};

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

let catalogCache: CatalogProduct[] | null = null;

async function catalogProducts() {
  if (catalogCache) return catalogCache;
  const file = path.resolve(here, "../../../prisma/catalog.ts");
  const loaded = (await import(pathToFileURL(file).href)) as { catalogProducts: CatalogProduct[] };
  catalogCache = loaded.catalogProducts;
  return catalogCache;
}

function toProduct(item: CatalogProduct) {
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
    category: {
      ...category,
      _count: { products: 0 },
    },
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

export async function offlineCategories() {
  const items = await catalogProducts();
  return categories.map((category) => ({
    ...category,
    _count: { products: items.filter((item) => item.category === category.slug).length },
  }));
}

export async function offlineProducts(query: {
  featured?: boolean;
  category?: string;
  gender?: string;
  q?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  let items = (await catalogProducts()).map(toProduct);
  if (query.featured) items = items.filter((item) => item.isFeatured);
  if (query.category) items = items.filter((item) => item.category.slug === query.category);
  if (query.gender) items = items.filter((item) => item.gender === query.gender);
  if (query.q) {
    const q = query.q.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q));
  }
  if (query.sort === "price_asc") items.sort((a, b) => Number(a.price) - Number(b.price));
  if (query.sort === "price_desc") items.sort((a, b) => Number(b.price) - Number(a.price));
  const total = items.length;
  return {
    items: items.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function offlineProductBySlug(slug: string) {
  const items = (await catalogProducts()).map(toProduct);
  const product = items.find((item) => item.slug === slug);
  if (!product) return null;
  return {
    product,
    related: items.filter((item) => item.slug !== slug && item.categoryId === product.categoryId).slice(0, 4),
  };
}

export function offlineSettings() {
  return {
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
  };
}
