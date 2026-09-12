import { Link } from "react-router-dom";
import { useCart } from "../../lib/cart";
import { useSettings } from "../../lib/hooks";
import { formatMoney, mediaUrl } from "../../lib/utils";
import { Seo } from "../../components/Seo";
import { EmptyState } from "../../components/States";
import { colorLabel, sq } from "../../lib/i18n";

export function CartPage() {
  const { items, update, remove, subtotal } = useCart();
  const { data: settings } = useSettings();
  const fee = Number(settings?.deliveryFee ?? 0);
  const threshold = settings?.freeDeliveryThreshold ? Number(settings.freeDeliveryThreshold) : null;
  const delivery = threshold && subtotal >= threshold ? 0 : fee;
  const total = subtotal + delivery;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <Seo title={sq.cart.title} />
      <h1 className="nav-type-lg">{sq.cart.title}</h1>
      {!items.length ? (
        <div className="mt-10">
          <EmptyState title={sq.cart.emptyTitle} body={sq.cart.emptyBody} />
          <Link to="/shop" className="mt-6 inline-block text-[11px] uppercase tracking-brand">
            {sq.cart.continue}
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_320px]">
          <div className="divide-y divide-line border-y border-line">
            {items.map((item) => (
              <div key={item.productId + (item.color ?? "")} className="flex gap-3 py-5 md:gap-4 md:py-6">
                <Link to={`/product/${item.slug}`} className="h-28 w-20 shrink-0 bg-ivory md:h-32 md:w-24">
                  <img src={mediaUrl(item.image)} alt={item.name} className="img-cover" loading="lazy" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <Link to={`/product/${item.slug}`} className="block text-base font-medium leading-snug tracking-normal md:text-lg">
                      {item.name}
                    </Link>
                    {item.color ? <p className="mt-1 text-sm text-muted">{colorLabel(item.color)}</p> : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <div className="flex border border-line">
                        <button className="px-3 py-1" onClick={() => update(item.productId, item.quantity - 1, item.color)}>
                          −
                        </button>
                        <span className="px-3 py-1">{item.quantity}</span>
                        <button className="px-3 py-1" onClick={() => update(item.productId, item.quantity + 1, item.color)}>
                          +
                        </button>
                      </div>
                      <button className="text-sm text-muted" onClick={() => remove(item.productId, item.color)}>
                        {sq.cart.remove}
                      </button>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm md:text-base">{formatMoney(Number(item.price) * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <aside className="h-fit border border-line p-6 lg:sticky lg:top-28">
            <h2 className="nav-type">{sq.cart.summary}</h2>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>{sq.cart.subtotal}</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>{sq.cart.delivery}</span>
                <span>{delivery === 0 ? sq.cart.free : formatMoney(delivery)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <span>{sq.cart.total}</span>
                <span>{formatMoney(total)}</span>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted">{sq.cart.payOnDelivery}</p>
            <Link
              to="/checkout"
              className="mt-6 block bg-ink py-4 text-center text-[11px] uppercase tracking-brand text-white"
            >
              {sq.cart.checkout}
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
