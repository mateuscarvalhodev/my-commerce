"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SizeSelector } from "@/components/SizeSelector";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import type { CommerceImageSource } from "@/lib/commerce/types";

type ProductVariant = {
  id: string;
  size?: string;
  color?: string;
  priceDelta: number;
  stock: number;
};

type ProductActionsProps = {
  product: {
    id: string | number;
    title: string;
    price: number;
    image: CommerceImageSource;
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
  const router = useRouter();
  const { addItem } = useCart();
  const hasSizes = sizes.length > 0;

  const stockBySize = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of variants) {
      const key = v.size ?? v.color ?? "";
      if (key) map[key] = (map[key] ?? 0) + v.stock;
    }
    return map;
  }, [variants]);

  const firstInStock = sizes.find((s) => (stockBySize[s] ?? 0) > 0);
  const defaultSelected =
    defaultSize ?? firstInStock ?? sizes[0] ?? DEFAULT_SIZE;
  const [size, setSize] = useState<string>(defaultSelected);
  const [qty, setQty] = useState<number>(1);

  const selectedVariant = useMemo(() => {
    if (!hasSizes || variants.length === 0) return null;
    return variants.find((v) => (v.size ?? v.color) === size) ?? null;
  }, [size, variants, hasSizes]);

  const effectivePrice = selectedVariant
    ? product.price + selectedVariant.priceDelta
    : product.price;

  const sizeOutOfStock = hasSizes && (stockBySize[size] ?? 0) <= 0;
  const disabled = qty < 1 || (hasSizes && !size) || sizeOutOfStock;

  async function handleBuy() {
    if (disabled) return;

    if (sizeOutOfStock) {
      toast.error("Tamanho esgotado.");
      return;
    }

    await addItem({
      id: product.id,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      size: hasSizes ? size : undefined,
      variantId: selectedVariant?.id,
      qty,
    });

    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      {hasSizes ? (
        <SizeSelector
          value={size}
          onChange={setSize}
          sizes={sizes}
          stockBySize={stockBySize}
          label="Tamanho"
        />
      ) : (
        <p className="text-sm text-muted-foreground">Tamanho padrão</p>
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
          Comprar
        </Button>
      </div>
    </div>
  );
}
