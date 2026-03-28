"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { addToCart } from "@/actions/cart";
import { toast } from "sonner";

type ProductVariant = {
  id: string;
  size?: string;
  color?: string;
  priceDelta: number;
  stock: number;
};

type ProductActionsProps = {
  product: {
    id: string;
    title: string;
    price: number;
  };
  sizes?: string[];
  variants?: ProductVariant[];
  defaultSize?: string;
};

const DEFAULT_SIZE = "UN";

export function ProductActions({
  product,
  sizes = [],
  variants = [],
  defaultSize,
}: ProductActionsProps) {
  const hasSizes = sizes.length > 0;
  const defaultSelected = defaultSize ?? sizes[0] ?? DEFAULT_SIZE;
  const [size, setSize] = useState<string>(defaultSelected);
  const [qty, setQty] = useState<number>(1);
  const [adding, setAdding] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!hasSizes || variants.length === 0) return null;
    return variants.find((v) => (v.size ?? v.color) === size) ?? null;
  }, [size, variants, hasSizes]);

  const disabled = qty < 1 || (hasSizes && !size) || adding;

  async function handleBuy() {
    if (disabled) return;

    setAdding(true);
    try {
      await addToCart(product.id, qty, selectedVariant?.id);
      toast.success("Produto adicionado ao carrinho!");
    } catch {
      toast.error("Faca login para adicionar ao carrinho");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {hasSizes ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Tamanho</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Tamanho padrao</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-9 w-9 rounded-full border"
            onClick={() => setQty((currentQty) => Math.max(1, currentQty - 1))}
          >
            -
          </button>
          <span className="w-6 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="h-9 w-9 rounded-full border"
            onClick={() => setQty((currentQty) => currentQty + 1)}
          >
            +
          </button>
        </div>

        <Button
          type="button"
          className="h-11 flex-1 rounded-full text-sm font-semibold"
          disabled={disabled}
          onClick={() => void handleBuy()}
        >
          {adding ? "Adicionando..." : "Comprar"}
        </Button>
      </div>
    </div>
  );
}
