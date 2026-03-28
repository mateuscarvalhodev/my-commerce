"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateCartQuantity,
  calculateCartSubtotal,
} from "@/lib/commerce/mappers";
import type { CartLineItem } from "@/lib/commerce/types";

type CartContextValue = {
  items: CartLineItem[];
  addItem: (item: CartLineItem) => Promise<void>;
  removeItem: (id: CartLineItem["id"], size?: string) => Promise<void>;
  updateQty: (
    id: CartLineItem["id"],
    size: string | undefined,
    qty: number
  ) => Promise<void>;
  clear: () => Promise<void>;
  subtotal: number;
  totalQty: number;
  loading: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cinco_nos_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [serverLoading, setServerLoading] = useState(false);
  const itemsRef = useRef<CartLineItem[]>([]);
  const mergedRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue) as CartLineItem[];
      if (Array.isArray(parsedValue)) {
        setItems(parsedValue);
      }
    } catch {
    } finally {
      setStorageHydrated(true);
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !storageHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, storageHydrated]);

  // Sync with server cart when user is signed in
  const syncCartToServer = useCallback(
    async (nextItems: CartLineItem[]) => {
      if (!userId) return;

      try {
        // Delete existing cart items for user
        await supabase.from("cart_items").delete().eq("user_id", userId);

        if (nextItems.length === 0) return;

        // Insert new items
        const rows = nextItems.map((item) => ({
          user_id: userId,
          product_id: String(item.id),
          quantity: item.qty,
          size: item.size ?? null,
          price: item.price,
        }));

        await supabase.from("cart_items").insert(rows);
      } catch {
        // Silently fail - localStorage is the source of truth
      }
    },
    [userId, supabase]
  );

  // Load server cart on login
  useEffect(() => {
    if (!storageHydrated || !userId || mergedRef.current) return;

    async function loadServerCart() {
      setServerLoading(true);
      try {
        const { data: serverItems } = await supabase
          .from("cart_items")
          .select("*, product:products(id, name, price, image_url)")
          .eq("user_id", userId!);

        if (!serverItems || serverItems.length === 0) {
          mergedRef.current = true;
          setServerLoading(false);
          return;
        }

        const serverCartLines: CartLineItem[] = serverItems.map((item) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const product = item.product as any;
          return {
            id: item.product_id,
            title: product?.name ?? `Produto ${item.product_id}`,
            image: {
              src: product?.image_url ?? "/product-placeholder.svg",
              alt: product?.name ?? "Produto",
            },
            price: Number(item.price) || Number(product?.price) || 0,
            qty: item.quantity,
            size: item.size ?? undefined,
          };
        });

        const localItems = itemsRef.current;
        if (localItems.length > 0) {
          // Merge: local takes precedence
          const merged = [...localItems];
          for (const serverItem of serverCartLines) {
            const exists = merged.some(
              (m) =>
                String(m.id) === String(serverItem.id) &&
                (m.size ?? "") === (serverItem.size ?? "")
            );
            if (!exists) {
              merged.push(serverItem);
            }
          }
          setItems(merged);
        } else {
          setItems(serverCartLines);
        }

        mergedRef.current = true;
      } catch {
        // Ignore errors
      } finally {
        setServerLoading(false);
      }
    }

    void loadServerCart();
  }, [storageHydrated, userId, supabase]);

  const commitCartUpdate = useCallback(
    async (updater: (currentItems: CartLineItem[]) => CartLineItem[]) => {
      const nextItems = updater(itemsRef.current);
      setItems(nextItems);
      await syncCartToServer(nextItems);
    },
    [syncCartToServer]
  );

  const addItem = useCallback(
    async (item: CartLineItem) => {
      await commitCartUpdate((currentItems) => {
        const existingItemIndex = currentItems.findIndex(
          (currentItem) =>
            String(currentItem.id) === String(item.id) &&
            (currentItem.size ?? "") === (item.size ?? "")
        );

        if (existingItemIndex >= 0) {
          return currentItems.map((currentItem, index) =>
            index === existingItemIndex
              ? { ...currentItem, qty: currentItem.qty + item.qty }
              : currentItem
          );
        }

        return [...currentItems, item];
      });
    },
    [commitCartUpdate]
  );

  const removeItem = useCallback(
    async (id: CartLineItem["id"], size?: string) => {
      await commitCartUpdate((currentItems) =>
        currentItems.filter(
          (item) =>
            !(
              String(item.id) === String(id) &&
              (item.size ?? "") === (size ?? "")
            )
        )
      );
    },
    [commitCartUpdate]
  );

  const updateQty = useCallback(
    async (id: CartLineItem["id"], size: string | undefined, qty: number) => {
      if (qty < 1) {
        return;
      }

      await commitCartUpdate((currentItems) =>
        currentItems.map((item) =>
          String(item.id) === String(id) && (item.size ?? "") === (size ?? "")
            ? { ...item, qty }
            : item
        )
      );
    },
    [commitCartUpdate]
  );

  const clear = useCallback(async () => {
    await commitCartUpdate(() => []);
  }, [commitCartUpdate]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clear,
      subtotal: calculateCartSubtotal(items),
      totalQty: calculateCartQuantity(items),
      loading: serverLoading,
    }),
    [addItem, clear, items, removeItem, serverLoading, updateQty]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
