"use client";

import Link from "next/link";
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CommerceImage } from "@/components/ui/commerce-image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { currency } from "@/utils/currency";

export function CartPageContent() {
  const { items, loading, removeItem, subtotal, updateQty } = useCart();

  if (loading && items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="size-10 animate-spin opacity-60" />
          <h1 className="text-xl font-bold">Carregando carrinho</h1>
          <p className="text-sm text-muted-foreground">
            Buscando os itens salvos no backend.
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
          <h1 className="text-xl font-bold">Seu carrinho está vazio</h1>
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
          {items.map((item) => (
            <div
              key={`${item.id}-${item.size ?? "un"}`}
              className="grid grid-cols-[88px,1fr,auto] gap-4 p-4"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-md bg-primary/10">
                <CommerceImage
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="min-w-0 space-y-2">
                <div>
                  <div className="truncate font-semibold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.size ? `Tam: ${item.size}` : "Tamanho padrão"}
                  </div>
                </div>

                <div className="inline-flex items-center rounded-md border">
                  <button
                    type="button"
                    className="h-8 w-8 text-xs"
                    onClick={() =>
                      void updateQty(item.id, item.size, item.qty - 1)
                    }
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="mx-auto size-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    className="h-8 w-8 text-xs"
                    onClick={() =>
                      void updateQty(item.id, item.size, item.qty + 1)
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
                  onClick={() => void removeItem(item.id, item.size)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remover item"
                >
                  <Trash2 className="size-4" />
                </button>
                <div className="text-right font-semibold">
                  {currency(item.price * item.qty)}
                </div>
              </div>
            </div>
          ))}
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
