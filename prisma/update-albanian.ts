import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { catalogProducts } from "./catalog";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

const prisma = new PrismaClient();

async function main() {
  await prisma.websiteSettings.update({
    where: { id: "default" },
    data: {
      announcementBarText: "Dorëzim falas për porosi të zgjedhura. Pagesë në dorëzim.",
      footerText: "IVA Accessories. Çanta, syze dhe portofola të përzgjedhura me kujdes.",
      orderConfirmationMessage: "Faleminderit për porosinë. Do t'ju kontaktojmë së shpejti për ta konfirmuar.",
      deliveryInformation: "Do ta konfirmojmë porosinë dhe do ta organizojmë dorëzimin. Paguani kur t'ju vijë porosia.",
      heroHeadline: "Aksesorë që përcaktojnë stilin tuaj.",
      heroSubheadline: "Një koleksion i përzgjedhur çantash, syzesh dhe portofolash — për çdo ditë.",
      promoBannerTitle: "Përzgjedhja e re",
      promoBannerText:
        "Zbuloni çanta të strukturuara, syze të rafinuara dhe portofola kompakte për gardërobën moderne.",
      promoBannerCta: "Shiko koleksionin",
      whyShopBenefits: [
        {
          title: "Aksesorë të përzgjedhur",
          description: "Çdo copë zgjidhet për materialin, formën dhe përdorimin e përditshëm.",
        },
        {
          title: "Porosi e lehtë",
          description: "Shfletoni, shtoni në çantë dhe porositni me disa hapa — pa llogari.",
        },
        {
          title: "Pagesë në dorëzim",
          description: "Paguani kur t'ju vijë porosia. E thjeshtë dhe e qartë.",
        },
        {
          title: "Mbështetje për klientët",
          description: "Pyetje për madhësinë, stokun ose një porosi? Jemi këtu.",
        },
      ],
    },
  });

  const categories = [
    { slug: "bags", name: "Çanta", description: "Çanta me dorezë, flap të qepura dhe crossbody për çdo ditë." },
    { slug: "sunglasses", name: "Syze", description: "Korniza të rafinuara, të zgjedhura për formë dhe përdorim të përditshëm." },
    { slug: "wallets", name: "Portofola", description: "Portofola dhe mbajtëse kartash kompakte, me përfundim të pastër." },
    { slug: "jewelry", name: "Bizhuteri", description: "Varëse, byzylykë dhe vathë për të përfunduar look-un." },
  ];

  for (const category of categories) {
    await prisma.category.updateMany({
      where: { slug: category.slug },
      data: { name: category.name, description: category.description },
    });
  }

  for (const product of catalogProducts) {
    await prisma.product.updateMany({
      where: { sku: product.sku },
      data: {
        name: product.name,
        description: product.description,
        colors: product.colors,
      },
    });
  }

  console.log("Albanian store copy updated.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
