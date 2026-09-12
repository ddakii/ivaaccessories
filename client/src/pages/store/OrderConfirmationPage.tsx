import { Link, useLocation, useParams } from "react-router-dom";
import { formatMoney } from "../../lib/utils";
import { Seo } from "../../components/Seo";
import type { Order } from "../../lib/types";
import { useSettings } from "../../lib/hooks";
import { sq } from "../../lib/i18n";

export function OrderConfirmationPage() {
  const { orderNumber } = useParams();
  const location = useLocation();
  const order = (location.state as { order?: Order } | null)?.order;
  const { data: settings } = useSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
      <Seo title={sq.confirm.title(orderNumber)} />
      <p className="text-[11px] uppercase tracking-brand text-gold">{sq.confirm.received}</p>
      <h1 className="nav-type-lg mt-3">{sq.confirm.thanks}</h1>
      <p className="mt-4 text-muted">
        {order?.confirmationMessage || settings?.orderConfirmationMessage || sq.confirm.defaultMessage}
      </p>
      <div className="mt-10 border border-line p-6">
        <p className="text-sm text-muted">{sq.confirm.orderNumber}</p>
        <p className="nav-type-lg">{orderNumber}</p>
        {order ? (
          <div className="mt-6 space-y-2 text-sm">
            <p>{order.fullName}</p>
            <p>
              {order.address}, {order.city}
            </p>
            <p>{sq.confirm.payment}</p>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 py-3">
                  <span className="min-w-0">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatMoney(Number(item.unitPrice) * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-3">
              <span>{sq.cart.subtotal}</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{sq.cart.delivery}</span>
              <span>{formatMoney(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span>{sq.cart.total}</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        ) : null}
        <p className="mt-6 text-sm text-muted">{settings?.deliveryInformation}</p>
      </div>
      <Link
        to={`/track-order?order=${orderNumber ?? ""}`}
        className="mt-8 inline-block bg-ink px-6 py-3 text-[11px] uppercase tracking-brand text-white"
      >
        {sq.confirm.track}
      </Link>
    </div>
  );
}
