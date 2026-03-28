"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { addToCart } from "@/actions/cart";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  options: Record<string, string>;
  is_active: boolean;
}

export function AddToCartButton({
  productId,
  disabled,
  variants,
}: {
  productId: string;
  disabled: boolean;
  variants?: Variant[];
}) {
  const [loading, setLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  );

  const activeVariants = variants?.filter((v) => v.is_active) ?? [];
  const hasVariants = activeVariants.length > 0;
  const selectedVariant = activeVariants.find(
    (v) => v.id === selectedVariantId
  );
  const isDisabled =
    disabled || loading || (hasVariants && !selectedVariantId);

  async function handleAddToCart() {
    setLoading(true);
    try {
      await addToCart(productId, 1, selectedVariantId ?? undefined);
      toast.success("Produto adicionado ao carrinho!");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro ao adicionar ao carrinho"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Variant selector */}
      {hasVariants ? (
        <div className="space-y-3">
          <Label>Variante</Label>
          <div className="flex flex-wrap gap-2">
            {activeVariants.map((variant) => {
              const optionLabel =
                Object.values(variant.options).join(" / ") || variant.name;
              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variant.stock <= 0}
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm transition-colors",
                    selectedVariantId === variant.id
                      ? "border-primary bg-primary/5 font-medium ring-1 ring-primary"
                      : "hover:bg-muted/50",
                    variant.stock <= 0 &&
                      "cursor-not-allowed opacity-50 line-through"
                  )}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        disabled={isDisabled}
        onClick={handleAddToCart}
      >
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <ShoppingCart className="mr-2 size-4" />
        )}
        Adicionar ao carrinho
      </Button>
    </div>
  );
}
