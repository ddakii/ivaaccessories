import { useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Product } from "../../lib/types";
import { useCart } from "../../lib/cart";
import { displayPrice, formatMoney, mediaUrl } from "../../lib/utils";
import { ProductCard } from "../../components/ProductCard";
import { Seo } from "../../components/Seo";
import { ErrorState, Skeleton } from "../../components/States";
import { categoryLabel, colorLabel, genderLabel, sq } from "../../lib/i18n";
import { scrollToPageTop } from "../../lib/scroll";

export function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState<string>();
  const [active, setActive] = useState(0);

  const query = useQuery({
    queryKey: ["product", slug],
    queryFn: async () =>
      (
        await api.get<{ success: true; data: { product: Product; related: Product[] } }>(
          `/api/products/slug/${slug}`
        )
      ).data,
  });

  useLayoutEffect(() => {
    scrollToPageTop();
    setQty(1);
    setColor(undefined);
    setActive(0);
  }, [slug]);

  if (query.isLoading) {
    return (
      <div id="product-top" className="mx-auto grid max-w-7xl gap-6 px-4 py-4 md:grid-cols-2 md:gap-10 md:px-8 md:py-12">
        <Skeleton className="aspect-[4/5]" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  if (query.error || !query.data) {
    return <ErrorState message={sq.product.notFound} />;
  }

  const product = query.data.product;
  const pricing = displayPrice(product.price, product.salePrice);
  const out = product.stock <= 0;
  const images = product.images.length ? product.images : [{ url: "" }];

  return (
    <div id="product-top" className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-12">
      <Seo
        title={product.name}
        description={product.description}
        image={mediaUrl(product.images[0]?.url)}
        path={`/product/${product.slug}`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.sku,
            image: mediaUrl(product.images[0]?.url),
            offers: {
              "@type": "Offer",
              priceCurrency: "EUR",
              price: pricing.current,
              availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            },
          }),
        }}
      />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <div className="aspect-[4/5] bg-ivory">
            {images[active]?.url ? (
              <img src={mediaUrl(images[active].url)} alt={product.name} decoding="async" className="img-cover" />
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button key={image.url + index} onClick={() => setActive(index)} className="aspect-square bg-ivory">
                  <img src={mediaUrl(image.url)} alt="" className="img-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-brand text-gold">
            {categoryLabel(product.category.slug, product.category.name)} · {genderLabel(product.gender)}
          </p>
          <h1 className="mt-3 text-2xl font-medium leading-snug tracking-normal md:text-4xl">{product.name}</h1>
          <p className="mt-5 text-lg">
            {pricing.onSale ? (
              <>
                <span className="text-gold">{formatMoney(pricing.current)}</span>
                <span className="ml-3 text-muted line-through">{formatMoney(pricing.original!)}</span>
              </>
            ) : (
              formatMoney(pricing.current)
            )}
          </p>
          <p className="mt-6 max-w-lg text-sm leading-relaxed tracking-normal text-muted">{product.description}</p>
          {product.colors.length ? (
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-brand">{sq.product.colour}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((item) => (
                  <button
                    key={item}
                    onClick={() => setColor(item)}
                    className={`border px-3 py-2 text-sm ${color === item ? "border-ink bg-ink text-white" : "border-line"}`}
                  >
                    {colorLabel(item)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex border border-line">
              <button className="px-3 py-3" onClick={() => setQty((n) => Math.max(1, n - 1))}>
                −
              </button>
              <span className="px-4 py-3">{qty}</span>
              <button className="px-3 py-3" onClick={() => setQty((n) => Math.min(product.stock || 1, n + 1))}>
                +
              </button>
            </div>
            <p className="text-sm text-muted">
              {out ? sq.product.outOfStock : `${product.stock} ${sq.product.inStock}`}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={out}
              onClick={() => add(product, qty, color)}
              className="bg-ink px-8 py-4 text-[11px] uppercase tracking-brand text-white disabled:bg-muted"
            >
              {sq.product.addToBag}
            </button>
            <button
              disabled={out}
              onClick={() => {
                add(product, qty, color);
                navigate("/checkout");
              }}
              className="border border-ink px-8 py-4 text-[11px] uppercase tracking-brand disabled:text-muted"
            >
              {sq.product.buyNow}
            </button>
          </div>
          <dl className="mt-10 space-y-2 text-sm text-muted">
            <div>SKU {product.sku}</div>
            <div>{sq.product.payOnDelivery}</div>
          </dl>
        </div>
      </div>
      {query.data.related.length ? (
        <section className="mt-12 md:mt-24">
          <h2 className="nav-type">{sq.product.related}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:mt-8 md:gap-8 lg:grid-cols-4">
            {query.data.related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
      <p className="mt-12 text-sm">
        <Link to="/shop" className="luxury-underline">
          {sq.product.back}
        </Link>
      </p>
    </div>
  );
}
