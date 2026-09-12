import { Link } from "react-router-dom";
import { displayPrice, formatMoney, mediaUrl } from "../lib/utils";
import type { Product } from "../lib/types";
import { useCart } from "../lib/cart";
import { categoryLabel, sq } from "../lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const pricing = displayPrice(product.price, product.salePrice);
  const image = mediaUrl(product.images[0]?.url);
  const out = product.stock <= 0;

  return (
    <article className="group min-w-0">
      <Link to={`/product/${product.slug}`} className="block overflow-hidden bg-ivory">
        <div className="relative aspect-[4/5]">
          {image ? (
            <img
              src={image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="img-cover md:transition md:duration-500 md:group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-brand text-muted">
              IVA
            </div>
          )}
          {product.isNewArrival ? (
            <span className="absolute left-2 top-2 bg-white px-2 py-1 text-[10px] uppercase tracking-brand md:left-3 md:top-3">
              {sq.product.new}
            </span>
          ) : null}
          {out ? (
            <span className="absolute inset-x-0 bottom-0 bg-white/90 py-2 text-center text-[10px] uppercase tracking-brand">
              {sq.product.outOfStock}
            </span>
          ) : null}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2 md:mt-4 md:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-brand text-muted">
            {categoryLabel(product.category?.slug, product.category?.name)}
          </p>
          <Link to={`/product/${product.slug}`} className="mt-1 block text-sm font-medium leading-snug tracking-normal md:text-base">
            {product.name}
          </Link>
          <p className="mt-2 text-sm">
            {pricing.onSale ? (
              <>
                <span className="text-gold">{formatMoney(pricing.current)}</span>
                <span className="ml-2 text-muted line-through">{formatMoney(pricing.original!)}</span>
              </>
            ) : (
              formatMoney(pricing.current)
            )}
          </p>
        </div>
        <button
          type="button"
          disabled={out}
          onClick={() => add(product, 1, product.colors[0])}
          className="mt-5 shrink-0 text-[10px] uppercase tracking-brand text-ink disabled:text-muted"
        >
          {sq.product.add}
        </button>
      </div>
    </article>
  );
}
