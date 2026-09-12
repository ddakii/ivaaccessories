import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, ApiError } from "../../lib/api";
import { formatMoney } from "../../lib/utils";
import { Seo } from "../../components/Seo";
import type { Order } from "../../lib/types";
import { sq, statusLabel } from "../../lib/i18n";

const schema = z.object({
  orderNumber: z.string().min(3),
  phone: z.string().min(8),
});

export function TrackOrderPage() {
  const [params] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { orderNumber: params.get("order") ?? "", phone: "" },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await api.post<{ success: true; data: Order }>("/api/orders/track", values);
    setOrder(res.data);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-8 md:py-16">
      <Seo title={sq.track.title} />
      <h1 className="nav-type-lg">{sq.track.title}</h1>
      <p className="mt-3 text-sm text-muted">{sq.track.intro}</p>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await onSubmit(values);
          } catch (error) {
            form.setError("orderNumber", {
              message: error instanceof ApiError ? error.message : sq.track.notFound,
            });
          }
        })}
        className="mt-8 space-y-4"
      >
        <input
          {...form.register("orderNumber")}
          placeholder={sq.track.orderPlaceholder}
          className="w-full border border-line px-3 py-3"
        />
        <input
          {...form.register("phone")}
          placeholder={sq.track.phonePlaceholder}
          className="w-full border border-line px-3 py-3"
        />
        <button className="bg-ink px-6 py-3 text-[11px] uppercase tracking-brand text-white">
          {sq.track.lookup}
        </button>
        {form.formState.errors.orderNumber ? (
          <p className="text-sm text-red-700">{form.formState.errors.orderNumber.message}</p>
        ) : null}
      </form>
      {order ? (
        <div className="mt-10 border border-line p-6">
          <p className="text-[11px] uppercase tracking-brand text-gold">{statusLabel(order.status)}</p>
          <h2 className="nav-type-lg mt-2">{order.orderNumber}</h2>
          <p className="mt-2 text-sm text-muted">{new Date(order.createdAt).toLocaleString("sq-AL")}</p>
          <p className="mt-4 text-sm">
            {order.fullName}
            <br />
            {order.address}, {order.city}
          </p>
          <div className="mt-6 space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0">
                  {item.productName} × {item.quantity}
                </span>
                <span className="shrink-0">{formatMoney(Number(item.unitPrice) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-3">
              <span>{sq.cart.total}</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
          {order.deliveryInformation ? (
            <p className="mt-4 text-sm text-muted">{order.deliveryInformation}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
