import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Product } from "../../lib/types";
import { ProductCard } from "../../components/ProductCard";
import { Seo } from "../../components/Seo";
import { EmptyState, Skeleton } from "../../components/States";
import { sq } from "../../lib/i18n";

const titles: Record<string, string> = {
  bags: sq.nav.bags,
  sunglasses: sq.nav.sunglasses,
  wallets: sq.nav.wallets,
  jewelry: sq.categories.jewelry,
  women: sq.nav.women,
  men: sq.nav.men,
};

export function ShopPage() {
  const { category, gender } = useParams();
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const q = params.get("q") ?? "";
  const sort = params.get("sort") ?? "newest";
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const genderFilter = gender?.toUpperCase() || params.get("gender") || "";
  const page = Number(params.get("page") ?? 1);

  const queryString = useMemo(() => {
    const search = new URLSearchParams();
    if (q) search.set("q", q);
    if (category && !["women", "men"].includes(category)) search.set("category", category);
    const g = category === "women" ? "WOMEN" : category === "men" ? "MEN" : genderFilter;
    if (g) search.set("gender", g);
    if (sort) search.set("sort", sort);
    if (minPrice) search.set("minPrice", minPrice);
    if (maxPrice) search.set("maxPrice", maxPrice);
    search.set("page", String(page));
    search.set("limit", "12");
    return search.toString();
  }, [q, category, genderFilter, sort, minPrice, maxPrice, page]);

  const products = useQuery({
    queryKey: ["products", queryString],
    queryFn: async () =>
      api.get<{ success: true; data: Product[]; meta: { total: number; totalPages: number } }>(
        `/api/products?${queryString}`
      ),
    staleTime: 30_000,
  });

  const heading = titles[category ?? ""] ?? (q ? `${sq.shop.resultsFor} “${q}”` : sq.shop.shop);

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
    if (key === "page") window.scrollTo(0, 0);
  }

  const filters = (
    <div className="space-y-6 text-sm">
      <div>
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.shop.sort}</p>
        <select
          value={sort}
          onChange={(e) => set("sort", e.target.value)}
          className="mt-2 w-full border border-line bg-white px-3 py-2"
        >
          <option value="newest">{sq.shop.newest}</option>
          <option value="featured">{sq.shop.featured}</option>
          <option value="price_asc">{sq.shop.priceAsc}</option>
          <option value="price_desc">{sq.shop.priceDesc}</option>
          <option value="best_selling">{sq.shop.bestSelling}</option>
        </select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.shop.gender}</p>
        <select
          value={genderFilter}
          onChange={(e) => set("gender", e.target.value)}
          className="mt-2 w-full border border-line bg-white px-3 py-2"
        >
          <option value="">{sq.shop.all}</option>
          <option value="WOMEN">{sq.shop.women}</option>
          <option value="MEN">{sq.shop.men}</option>
          <option value="UNISEX">{sq.shop.unisex}</option>
        </select>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-brand text-gold">{sq.shop.price}</p>
        <div className="mt-2 flex gap-2">
          <input
            placeholder={sq.shop.min}
            value={minPrice}
            onChange={(e) => set("minPrice", e.target.value)}
            className="w-full border border-line px-3 py-2"
          />
          <input
            placeholder={sq.shop.max}
            value={maxPrice}
            onChange={(e) => set("maxPrice", e.target.value)}
            className="w-full border border-line px-3 py-2"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
      <Seo title={heading} description={sq.shop.seo(heading)} />
      <p className="text-[11px] uppercase tracking-brand text-gold">{sq.shop.collection}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <h1 className="nav-type-lg min-w-0">{heading}</h1>
        <p className="text-sm text-muted">
          {products.data?.meta.total ?? 0} {sq.shop.pieces}
        </p>
      </div>
      <button
        className="mt-6 border border-ink px-4 py-2 text-[11px] uppercase tracking-brand md:hidden"
        onClick={() => setMobileFilters(true)}
      >
        {sq.shop.filters}
      </button>
      <div className="mt-10 grid gap-10 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">{filters}</aside>
        <div>
          {products.isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5]" />
              ))}
            </div>
          ) : !products.data?.data.length ? (
            <EmptyState title={sq.shop.emptyTitle} body={sq.shop.emptyBody} />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
              {products.data.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {(products.data?.meta.totalPages ?? 1) > 1 ? (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: products.data!.meta.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => set("page", String(i + 1))}
                  className={`h-10 w-10 border ${page === i + 1 ? "border-ink bg-ink text-white" : "border-line"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {mobileFilters ? (
        <div className="fixed inset-0 z-50 bg-white p-6 md:hidden">
          <div className="flex justify-between">
            <p className="nav-type">{sq.shop.filters}</p>
            <button onClick={() => setMobileFilters(false)}>{sq.shop.close}</button>
          </div>
          <div className="mt-8">{filters}</div>
        </div>
      ) : null}
    </div>
  );
}
