"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getCart, updateCartItem, removeCartItem } from "@/actions/cart";
import { currency } from "@/utils/currency";
import { toast } from "sonner";

type CartItem = {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url?: string | null;
    product_images?: { url: string; is_primary?: boolean }[];
  };
  variant?: {
    id: string;
    name?: string;
    size?: string;
    color?: string;
    price_delta?: number;
  } | null;
};

export function CartPageContent() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await getCart();
        setItems((result.items as any) ?? []);
      } catch {
        // Not authenticated or empty cart
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleUpdateQty(itemId: string, newQty: number) {
    setUpdatingId(itemId);
    try {
      await updateCartItem(itemId, newQty);
      if (newQty <= 0) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
        );
      }
    } catch {
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
      toast.success("Item removido");
    } catch {
      toast.error("Erro ao remover item");
    } finally {
      setUpdatingId(null);
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  if (loading && items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando carrinho</h1>
          <p className="text-sm text-muted-foreground">
            Buscando os itens salvos.
          </p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShoppingBag className="size-10 opacity-60" />
          <h1 className="text-xl font-bold">Seu carrinho esta vazio</h1>
          <p className="text-sm text-muted-foreground">
            Escolha seus produtos e volte aqui para finalizar a compra.
          </p>
          <Button asChild>
            <Link href="/products">Continuar comprando</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-4 py-8 md:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">Carrinho</h1>
          <p className="text-sm text-muted-foreground"></p>
        </div>

        <div className="divide-y rounded-2xl border bg-white">
          {items.map((item) => {
            const image =
              item.product.product_images?.find((img) => img.is_primary) ??
              item.product.product_images?.[0];
            const imageUrl = image?.url ?? item.product.image_url;
            const sizeLabel = item.variant?.size ?? item.variant?.color;
            const isUpdating = updatingId === item.id;

            return (
              <div
                key={item.id}
                className="grid grid-cols-[88px,1fr,auto] gap-4 p-4"
              >
                <div className="relative h-20 w-20 overflow-hidden rounded-md bg-primary/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 space-y-2">
                  <div>
                    <div className="truncate font-semibold">{item.product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {sizeLabel ? `Tam: ${sizeLabel}` : "Tamanho padrao"}
                    </div>
                  </div>

                  <div className="inline-flex items-center rounded-md border">
                    <button
                      type="button"
                      className="h-8 w-8 text-xs"
                      disabled={isUpdating}
                      onClick={() =>
                        void handleUpdateQty(item.id, item.quantity - 1)
                      }
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="mx-auto size-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="h-8 w-8 text-xs"
                      disabled={isUpdating}
                      onClick={() =>
                        void handleUpdateQty(item.id, item.quantity + 1)
                      }
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="mx-auto size-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between gap-2">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => void handleRemove(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <div className="text-right font-semibold">
                    {currency(Number(item.price) * item.quantity)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="h-fit space-y-4 rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold">Resumo</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium">{currency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Frete</span>
            <span className="text-muted-foreground">Calcular no checkout</span>
          </div>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-lg">
          <span className="font-semibold">Total</span>
          <span className="font-extrabold">{currency(subtotal)}</span>
        </div>
        <Button asChild className="w-full">
          <Link href="/checkout">Finalizar compra</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/products">Continuar comprando</Link>
        </Button>
      </aside>
    </main>
  );
}
