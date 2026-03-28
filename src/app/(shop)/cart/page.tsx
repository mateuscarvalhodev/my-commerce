"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCart, updateCartItem, removeCartItem } from "@/actions/cart";
import { currency } from "@/lib/utils";

interface CartItemData {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    product_images?: { url: string; is_primary: boolean }[];
  };
  variant?: {
    id: string;
    name: string;
    price: number;
    price_delta?: number;
    options: Record<string, string>;
  } | null;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    try {
      const result = await getCart();
      setItems((result.items as any) ?? []);
    } catch {
      // Not authenticated or empty cart
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateQty(itemId: string, quantity: number) {
    setUpdatingId(itemId);
    try {
      await updateCartItem(itemId, quantity);
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
        );
      }
    } catch (error) {
      toast.error("Erro ao atualizar quantidade");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setUpdatingId(itemId);
    try {
      await removeCartItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item removido do carrinho");
    } catch {
      toast.error("Erro ao remover item");
    } finally {
      setUpdatingId(null);
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price
      ? item.product.price + (item.variant.price_delta ?? 0)
      : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando carrinho...</h1>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag className="size-12 text-muted-foreground/50" />
          <h1 className="text-2xl font-black">Carrinho vazio</h1>
          <p className="text-muted-foreground">
            Adicione produtos ao carrinho para continuar.
          </p>
          <Button asChild>
            <Link href="/products">Ver produtos</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight">Carrinho</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items list */}
        <div className="space-y-4">
          {items.map((item) => {
            const price = item.variant?.price
              ? item.product.price + (item.variant.price_delta ?? 0)
              : item.product.price;
            const image = item.product.product_images?.find(
              (img) => img.is_primary
            ) ?? item.product.product_images?.[0];
            const isUpdating = updatingId === item.id;

            return (
              <div
                key={item.id}
                className="flex gap-4 rounded-xl border bg-white p-4 shadow-sm"
              >
                {/* Image */}
                <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {image?.url ? (
                    <img
                      src={image.url}
                      alt={item.product.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ShoppingBag className="size-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold hover:underline"
                    >
                      {item.product.name}
                    </Link>
                    {item.variant ? (
                      <p className="text-xs text-muted-foreground">
                        {Object.values(item.variant.options).join(" / ") ||
                          item.variant.name}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    {/* Quantity */}
                    <div className="flex items-center gap-1 rounded-lg border">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity - 1)
                        }
                        className="flex size-8 items-center justify-center rounded-l-lg hover:bg-muted"
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          handleUpdateQty(item.id, item.quantity + 1)
                        }
                        className="flex size-8 items-center justify-center rounded-r-lg hover:bg-muted"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleRemove(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  <p className="font-bold">{currency(price * item.quantity)}</p>
                  {item.quantity > 1 ? (
                    <p className="text-xs text-muted-foreground">
                      {currency(price)} un.
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Resumo</h2>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{currency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Frete</span>
            <span className="text-muted-foreground">
              Calculado no checkout
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-black">{currency(subtotal)}</span>
          </div>
          <Button className="w-full" size="lg" asChild>
            <Link href="/checkout">Finalizar compra</Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href="/products">Continuar comprando</Link>
          </Button>
        </aside>
      </div>
    </main>
  );
}
