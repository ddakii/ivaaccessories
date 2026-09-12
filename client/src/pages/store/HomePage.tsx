import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useSettings } from "../../lib/hooks";
import { mediaUrl } from "../../lib/utils";
import type { Category, Product } from "../../lib/types";
import { ProductCard } from "../../components/ProductCard";
import { Seo } from "../../components/Seo";
import { Skeleton } from "../../components/States";
import { categoryLabel, sq } from "../../lib/i18n";

export function HomePage() {
  const { data: settings } = useSettings();
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<{ success: true; data: Category[] }>("/api/categories")).data,
    staleTime: 60_000,
  });
  const featured = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () =>
      (await api.get<{ success: true; data: Product[] }>("/api/products?featured=true&limit=8")).data,
    staleTime: 60_000,
  });

  const mainCats = (categories.data ?? []).filter((c) =>
    ["bags", "sunglasses", "wallets", "jewelry"].includes(c.slug)
  );

  return (
    <div>
      <Seo
        title="IVA Accessories"
        description={settings?.heroSubheadline}
        image={mediaUrl(settings?.heroImageUrl)}
      />
      <section className="relative min-h-[58vh] bg-ink text-white md:min-h-[78vh]">
        {settings?.heroImageUrl ? (
          <img
            src={mediaUrl(settings.heroImageUrl)}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl flex-col justify-end px-4 pb-12 pt-20 md:min-h-[78vh] md:px-8 md:pb-20 md:pt-32">
          <p className="text-[11px] uppercase tracking-brand text-gold">IVA Accessories</p>
          <h1 className="nav-type-xl mt-4 max-w-3xl">
            {settings?.heroHeadline ?? sq.home.heroFallback}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80">
            {settings?.heroSubheadline}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/shop" className="bg-white px-5 py-3 text-[11px] uppercase tracking-brand text-ink">
              {sq.home.shopCollection}
            </Link>
            <Link
              to="/shop/bags"
              className="border border-white px-5 py-3 text-[11px] uppercase tracking-brand"
            >
              {sq.home.explore}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.home.categories}</p>
        <h2 className="nav-type mt-2">{sq.home.collection}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:mt-10 md:gap-6 lg:grid-cols-4">
          {mainCats.map((category) => (
            <Link key={category.id} to={`/shop/${category.slug}`} className="group block min-w-0">
              <div className="aspect-[4/5] overflow-hidden bg-ivory">
                {category.imageUrl ? (
                  <img
                    src={mediaUrl(category.imageUrl)}
                    alt={category.name}
                    loading="lazy"
                    decoding="async"
                    className="img-cover md:transition md:duration-500 md:group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              <h3 className="nav-type mt-3 md:mt-4">
                {categoryLabel(category.slug, category.name)}
              </h3>
              <p className="mt-1 hidden text-sm text-muted sm:block">{category.description}</p>
              <span className="mt-2 inline-block text-[10px] uppercase tracking-brand md:mt-3 md:text-[11px]">
                {sq.home.shopCategory} {categoryLabel(category.slug, category.name)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-8 md:pb-20">
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.home.selected}</p>
        <h2 className="nav-type mt-2">{sq.home.featured}</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:mt-10 md:gap-8 lg:grid-cols-4">
          {featured.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)
            : featured.data?.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="relative mx-4 overflow-hidden bg-ink text-white md:mx-8">
        {settings?.promoBannerImage ? (
          <img
            src={mediaUrl(settings.promoBannerImage)}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="relative mx-auto max-w-3xl px-5 py-16 text-center md:px-6 md:py-24">
          <h2 className="nav-type-xl">{settings?.promoBannerTitle}</h2>
          <p className="mt-4 text-sm text-white/80">{settings?.promoBannerText}</p>
          <Link
            to="/shop"
            className="mt-8 inline-block border border-white px-6 py-3 text-[11px] uppercase tracking-brand"
          >
            {settings?.promoBannerCta || sq.home.shopFallback}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.home.why}</p>
        <h2 className="nav-type mt-2">{sq.home.whyTitle}</h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 md:mt-10 lg:grid-cols-4">
          {(settings?.whyShopBenefits ?? []).map((benefit) => (
            <div key={benefit.title} className="border-t border-line pt-6">
              <h3 className="nav-type">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
