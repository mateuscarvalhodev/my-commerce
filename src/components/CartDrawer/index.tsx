"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
  Package,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CommerceImage } from "@/components/ui/commerce-image";
import { currency } from "@/utils/currency";

type CartDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { items, loading, subtotal, totalQty, removeItem, updateQty } = useCart();

  const pixPercent = 5;
  const totalPix = subtotal * (1 - pixPercent / 100);
  const hasItems = items.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full px-0 sm:max-w-[520px]">
        <div className="flex h-full flex-col px-4">
          <SheetHeader className="flex flex-row items-center justify-between px-0 pb-3">
            <SheetTitle className="text-base font-semibold">
              Minhas Compras {hasItems && `(${totalQty})`}
            </SheetTitle>
          </SheetHeader>

          <Separator />

          <div className="max-h-[360px] flex-1 space-y-3 overflow-y-auto py-4">
            {loading && !hasItems ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="size-10 animate-spin opacity-60" />
                <p className="text-sm text-muted-foreground">
                  Buscando seu carrinho no backend.
                </p>
              </div>
            ) : null}

            {!loading && !hasItems ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <ShoppingBag className="size-10 opacity-60" />
                <p className="text-sm text-muted-foreground">
                  Seu carrinho esta vazio.
                </p>
                <SheetClose asChild>
                  <Button asChild variant="outline">
                    <Link href="/products">Ver catalogo</Link>
                  </Button>
                </SheetClose>
              </div>
            ) : null}

            {items.map((item) => (
              <div key={`${item.id}-${item.size ?? "un"}`} className="flex items-center gap-3">
                <div className="relative h-24 w-20 overflow-hidden rounded-md bg-primary/10">
                  <CommerceImage
                    src={item.image.src}
                    alt={item.image.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase leading-snug">
                      {item.title}
                      {item.size ? (
                        <span className="ml-1 text-[11px] font-normal text-muted-foreground uppercase">
                          ({item.size})
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="inline-flex items-center rounded-md border">
                      <button
                        type="button"
                        className="h-8 w-8 text-xs"
                        onClick={() => void updateQty(item.id, item.size, item.qty - 1)}
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
                        onClick={() => void updateQty(item.id, item.size, item.qty + 1)}
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="mx-auto size-3" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex h-full flex-col items-end justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => void removeItem(item.id, item.size)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  <div className="text-right text-sm font-semibold text-neutral-black">
                    {currency(item.price * item.qty)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasItems ? (
            <>
              <Separator />

              <div className="space-y-3 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Subtotal (sem frete):
                  </span>
                  <span className="font-semibold text-neutral-black">
                    {currency(subtotal)}
                  </span>
                </div>
              </div>

              <Separator />

              <DrawerShippingEstimate items={items} />

              <Separator />

              <div className="space-y-3 py-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total:</span>
                  <div className="text-right">
                    <div className="text-base font-extrabold text-neutral-black">
                      {currency(subtotal)}
                    </div>
                    <div className="text-[11px] text-accent">
                      Ou {currency(totalPix)} com Pix
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="space-y-3 px-0 pb-4">
                <SheetClose asChild>
                  <Button asChild className="w-full text-sm font-semibold">
                    <Link href="/checkout">Finalizar compra</Link>
                  </Button>
                </SheetClose>

                <SheetClose asChild>
                  <Button variant="ghost" className="w-full text-xs" asChild>
                    <Link href="/cart">Ver carrinho completo</Link>
                  </Button>
                </SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Shipping estimate inside drawer ──────────────────────────────────────────

type ShippingOpt = {
  service_code: string;
  service_name: string;
  price: number;
  deadline_days: number;
};

function DrawerShippingEstimate({
  items,
}: {
  items: { id: string | number; qty: number }[];
}) {
  const [cep, setCep] = useState("");
  const [options, setOptions] = useState<ShippingOpt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  async function handleCalculate() {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setError("CEP deve ter 8 dígitos");
      return;
    }

    setLoading(true);
    setError("");
    setOptions([]);

    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_cep: clean,
          items: items.map((i) => ({
            product_id: String(i.id),
            quantity: i.qty,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setOptions(data.options ?? []);
      setSearched(true);
    } catch {
      setError("Não foi possível calcular o frete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 py-4 text-sm">
      <div className="flex items-center gap-2">
        <Truck className="size-4 text-primary" />
        <span className="font-semibold uppercase text-[11px]">Calcular frete</span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          maxLength={9}
          className="h-8 flex-1 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 text-xs"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : "OK"}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {searched && options.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground">Sem opções para este CEP.</p>
      ) : null}

      {options.map((opt) => (
        <div
          key={opt.service_code}
          className="flex items-center justify-between rounded-md border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <Package className="size-3.5 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{opt.service_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {opt.deadline_days === 1 ? "1 dia útil" : `${opt.deadline_days} dias úteis`}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold">
            {opt.price === 0 ? (
              <span className="text-green-600">Grátis</span>
            ) : (
              currency(opt.price)
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
