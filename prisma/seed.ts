/**
 * DEVELOPMENT SEED ONLY
 * Creates sample categories, products, settings, and the first admin.
 * Do not run this against a production database that already has real catalogue data
 * unless you intend to reset development records.
 *
 *   npm run db:seed
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { catalogProducts } from "./catalog";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DEVELOPMENT data for IVA Accessories...");

  const email = (process.env.ADMIN_EMAIL ?? "admin@ivaaccessories.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "ChangeThisPassword123";
  const hash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash: hash, role: "SUPER_ADMIN", isActive: true },
    create: {
      email,
      passwordHash: hash,
      name: process.env.ADMIN_NAME ?? "Store Owner",
      role: "SUPER_ADMIN",
    },
  });

  const categories = [
    {
      name: "Çanta",
      slug: "bags",
      description: "Çanta me dorezë, flap të qepura dhe crossbody për çdo ditë.",
      imageUrl: "/uploads/products/bag-quilted-black.png",
      sortOrder: 1,
    },
    {
      name: "Syze",
      slug: "sunglasses",
      description: "Korniza të rafinuara, të zgjedhura për formë dhe përdorim të përditshëm.",
      imageUrl: "/uploads/products/sunglasses-rimless.png",
      sortOrder: 2,
    },
    {
      name: "Portofola",
      slug: "wallets",
      description: "Portofola dhe mbajtëse kartash kompakte, me përfundim të pastër.",
      imageUrl: "/uploads/products/bag-structured-beige.png",
      sortOrder: 3,
    },
    {
      name: "Bizhuteri",
      slug: "jewelry",
      description: "Varëse, byzylykë dhe vathë për të përfunduar look-un.",
      imageUrl: "/uploads/products/jewelry-pearl-choker.png",
      sortOrder: 4,
    },
  ];

  const categoryRecords: Record<string, string> = {};
  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
    categoryRecords[category.slug] = record.id;
  }

  for (const product of catalogProducts) {
    const imagePath = `/uploads/products/${product.image}`;
    const created = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        salePrice: product.salePrice ?? null,
        categoryId: categoryRecords[product.category],
        gender: product.gender,
        stock: product.stock,
        colors: product.colors,
        isFeatured: Boolean(product.featured),
        isNewArrival: Boolean(product.newArrival),
        isActive: true,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        sku: product.sku,
        price: product.price,
        salePrice: product.salePrice ?? null,
        categoryId: categoryRecords[product.category],
        gender: product.gender,
        stock: product.stock,
        colors: product.colors,
        isFeatured: Boolean(product.featured),
        isNewArrival: Boolean(product.newArrival),
        images: {
          create: [{ url: imagePath, alt: product.name, sortOrder: 0 }],
        },
      },
    });

    const imageCount = await prisma.productImage.count({ where: { productId: created.id } });
    if (imageCount === 0) {
      await prisma.productImage.create({
        data: { productId: created.id, url: imagePath, alt: product.name, sortOrder: 0 },
      });
    }
  }

  await prisma.websiteSettings.upsert({
    where: { id: "default" },
    update: {
      heroImageUrl: "/uploads/products/jewelry-pearl-choker.png",
      promoBannerImage: "/uploads/products/bag-structured-orange.png",
      storeEmail: process.env.STORE_EMAIL ?? "hello@ivaaccessories.com",
      storePhone: process.env.STORE_PHONE ?? "",
      deliveryFee: "3.00",
      freeDeliveryThreshold: "80.00",
      announcementBarText: "Dorëzim falas për porosi të zgjedhura. Pagesë në dorëzim.",
      footerText: "IVA Accessories. Çanta, syze dhe portofola të përzgjedhura me kujdes.",
      orderConfirmationMessage: "Faleminderit për porosinë. Do t'ju kontaktojmë së shpejti për ta konfirmuar.",
      deliveryInformation: "Do ta konfirmojmë porosinë dhe do ta organizojmë dorëzimin. Paguani kur t'ju vijë porosia.",
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
    },
    create: {
      id: "default",
      heroImageUrl: "/uploads/products/jewelry-pearl-choker.png",
      promoBannerImage: "/uploads/products/bag-structured-orange.png",
      storeEmail: process.env.STORE_EMAIL ?? "hello@ivaaccessories.com",
      storePhone: process.env.STORE_PHONE ?? "",
      deliveryFee: "3.00",
      freeDeliveryThreshold: "80.00",
      announcementBarText: "Dorëzim falas për porosi të zgjedhura. Pagesë në dorëzim.",
      footerText: "IVA Accessories. Çanta, syze dhe portofola të përzgjedhura me kujdes.",
      orderConfirmationMessage: "Faleminderit për porosinë. Do t'ju kontaktojmë së shpejti për ta konfirmuar.",
      deliveryInformation: "Do ta konfirmojmë porosinë dhe do ta organizojmë dorëzimin. Paguani kur t'ju vijë porosia.",
      heroHeadline: "Aksesorë që përcaktojnë stilin tuaj.",
      heroSubheadline: "Një koleksion i përzgjedhur çantash, syzesh dhe portofolash — për çdo ditë.",
      promoBannerTitle: "Përzgjedhja e re",
      promoBannerText: "Zbuloni çanta të strukturuara, syze të rafinuara dhe portofola kompakte për gardërobën moderne.",
      promoBannerCta: "Shiko koleksionin",
    },
  });

  await prisma.orderCounter.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", current: 1000 },
  });

  const uploads = path.resolve(here, "../server/uploads/products");
  if (!fs.existsSync(uploads)) {
    console.warn("Product images folder is missing:", uploads);
  }

  console.log("Development seed complete.");
  console.log(`Admin login: ${email}`);
  console.log("This seed is for local/development use. Remove or skip it in production.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
