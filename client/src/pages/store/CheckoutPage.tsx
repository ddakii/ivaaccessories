import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { api, ApiError } from "../../lib/api";
import { useCart } from "../../lib/cart";
import { useSettings } from "../../lib/hooks";
import { formatMoney, mediaUrl } from "../../lib/utils";
import { Seo } from "../../components/Seo";
import type { Order } from "../../lib/types";
import { sq } from "../../lib/i18n";

const schema = z.object({
  fullName: z.string().min(2, sq.checkout.nameRequired),
  phone: z
    .string()
    .min(8, sq.checkout.phoneRequired)
    .regex(/^[+\d][\d\s().-]{7,19}$/, sq.checkout.phoneRequired),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2, sq.checkout.cityRequired),
  address: z.string().min(5, sq.checkout.addressRequired),
  addressDetails: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.literal("COD"),
});

type FormValues = z.infer<typeof schema>;

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "COD", email: "" },
  });

  const fee = Number(settings?.deliveryFee ?? 0);
  const threshold = settings?.freeDeliveryThreshold ? Number(settings.freeDeliveryThreshold) : null;
  const delivery = threshold && subtotal >= threshold ? 0 : fee;
  const total = subtotal + delivery;

  async function onSubmit(values: FormValues) {
    if (!items.length) {
      toast.error(sq.checkout.bagEmpty);
      return;
    }
    try {
      const res = await api.post<{ success: true; data: Order }>("/api/orders", {
        ...values,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          color: item.color,
        })),
      });
      clear();
      navigate(`/order-confirmation/${res.data.orderNumber}`, { state: { order: res.data } });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : sq.checkout.failed);
    }
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="nav-type-lg">{sq.checkout.emptyTitle}</h1>
        <p className="mt-3 text-muted">{sq.checkout.emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_340px] md:gap-12 md:px-8 md:py-12">
      <Seo title={sq.checkout.title} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <h1 className="nav-type-lg">{sq.checkout.title}</h1>
        <p className="text-sm text-muted">{sq.checkout.intro}</p>
        {(
          [
            ["fullName", sq.checkout.fullName],
            ["phone", sq.checkout.phone],
            ["email", sq.checkout.email],
            ["city", sq.checkout.city],
            ["address", sq.checkout.address],
            ["addressDetails", sq.checkout.addressDetails],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block text-sm">
            {label}
            <input
              {...form.register(name)}
              className="mt-2 w-full border border-line px-3 py-3 outline-none focus:border-ink"
            />
            {form.formState.errors[name] ? (
              <span className="mt-1 block text-xs text-red-700">
                {form.formState.errors[name]?.message as string}
              </span>
            ) : null}
          </label>
        ))}
        <label className="block text-sm">
          {sq.checkout.notes}
          <textarea {...form.register("notes")} rows={4} className="mt-2 w-full border border-line px-3 py-3" />
        </label>
        <div className="border border-line bg-ivory p-5">
          <p className="text-[11px] uppercase tracking-brand text-gold">{sq.checkout.payment}</p>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input type="radio" checked readOnly className="mt-1" />
            <span>
              <strong>{sq.checkout.cod}</strong>
              <span className="mt-1 block text-muted">{sq.checkout.codHint}</span>
            </span>
          </label>
        </div>
        <button
          disabled={form.formState.isSubmitting}
          className="bg-ink px-8 py-4 text-[11px] uppercase tracking-brand text-white"
        >
          {form.formState.isSubmitting ? sq.checkout.placing : sq.checkout.place}
        </button>
      </form>
      <aside className="h-fit border border-line p-6 lg:sticky lg:top-28">
        <h2 className="nav-type">{sq.checkout.order}</h2>
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.productId + item.color} className="flex gap-3 text-sm">
              <img src={mediaUrl(item.image)} alt="" className="h-16 w-12 object-cover" />
              <div className="flex-1">
                <p>{item.name}</p>
                <p className="text-muted">
                  {item.quantity} × {formatMoney(item.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <span>{sq.cart.subtotal}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>{sq.cart.delivery}</span>
            <span>{delivery === 0 ? sq.cart.free : formatMoney(delivery)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span>{sq.cart.total}</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
