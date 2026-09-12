import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "./types";
import { displayPrice } from "./utils";
import { toast } from "sonner";

const KEY = "iva-cart";

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, quantity?: number, color?: string) => void;
  remove: (productId: string, color?: string) => void;
  update: (productId: string, quantity: number, color?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(item: CartItem, productId: string, color?: string) {
  return item.productId === productId && (item.color ?? "") === (color ?? "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const add = (product: Product, quantity = 1, color?: string) => {
      if (product.stock <= 0) {
        toast.error("Ky produkt aktualisht është jashtë stokut.");
        return;
      }
      setItems((current) => {
        const existing = current.find((item) => sameLine(item, product.id, color));
        const nextQty = (existing?.quantity ?? 0) + quantity;
        if (nextQty > product.stock) {
          toast.error("Ka vetëm sasi të kufizuar në stok.");
          return current;
        }
        const price = displayPrice(product.price, product.salePrice).current;
        const image = product.images[0]?.url ?? "";
        if (existing) {
          return current.map((item) =>
            sameLine(item, product.id, color) ? { ...item, quantity: nextQty, stock: product.stock } : item
          );
        }
        toast.success("U shtua në çantë");
        return [
          ...current,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            image,
            price,
            quantity,
            color,
            stock: product.stock,
          },
        ];
      });
    };

    const remove = (productId: string, color?: string) => {
      setItems((current) => current.filter((item) => !sameLine(item, productId, color)));
    };

    const update = (productId: string, quantity: number, color?: string) => {
      setItems((current) =>
        current
          .map((item) => {
            if (!sameLine(item, productId, color)) return item;
            if (quantity > item.stock) {
              toast.error("Nuk ka mjaftueshëm stok për këtë sasi.");
              return item;
            }
            return { ...item, quantity };
          })
          .filter((item) => item.quantity > 0)
      );
    };

    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    return { items, add, remove, update, clear: () => setItems([]), count, subtotal };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
