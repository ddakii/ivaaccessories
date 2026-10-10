import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("sq-AL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function mediaUrl(url?: string | null) {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http")) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/uploads")) return parsed.pathname;
    } catch {
      return url;
    }
    return url;
  }
  if (url.startsWith("/uploads")) return url;
  const api = import.meta.env.VITE_API_URL ?? "";
  return `${api}${url}`;
}

export function displayPrice(price: string, salePrice?: string | null) {
  if (salePrice && Number(salePrice) > 0 && Number(salePrice) < Number(price)) {
    return { current: salePrice, original: price, onSale: true };
  }
  return { current: price, original: null, onSale: false };
}
