import { Decimal } from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function money(value: Decimal.Value) {
  return new Decimal(value ?? 0);
}

export function moneyString(value: Decimal.Value) {
  return money(value).toFixed(2);
}

export function serializeDecimal(value: unknown) {
  if (value == null) return "0.00";
  return moneyString(String(value));
}

export function calculateDeliveryFee(
  subtotal: Decimal.Value,
  deliveryFee: Decimal.Value,
  freeThreshold: Decimal.Value | null | undefined
) {
  const sub = money(subtotal);
  const fee = money(deliveryFee);
  if (freeThreshold == null) return fee;
  const threshold = money(freeThreshold);
  if (threshold.greaterThan(0) && sub.greaterThanOrEqualTo(threshold)) {
    return money(0);
  }
  return fee;
}
