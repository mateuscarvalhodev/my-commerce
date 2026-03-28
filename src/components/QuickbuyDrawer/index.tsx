"use client";

import { useEffect, useState } from "react";
import { currency } from "@/utils/currency";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { X } from "lucide-react";
import { SizeSelector } from "../SizeSelector";
import { CommerceImage } from "@/components/ui/commerce-image";
import type { CommerceImageSource } from "@/lib/commerce/types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: {
    id: string | number;
    title: string;
    image: CommerceImageSource;
    price: number;
    originalPrice?: number | null;
  };
  sizes?: string[];
  defaultSize?: string;
  onAddToCart?: (args: {
    id: string | number;
    size?: string;
    qty: number;
  }) => Promise<void> | void;
};

const IMG_WIDTH = 140;
const DEFAULT_SIZE = "UN";

export function ProductQuickBuyDrawer({
  open,
  onOpenChange,
  product,
  sizes = [],
  defaultSize,
  onAddToCart,
}: Props) {
  const hasSizes = sizes.length > 0;
  const defaultSelected = defaultSize ?? sizes[0] ?? DEFAULT_SIZE;
  const [size, setSize] = useState<string>(defaultSelected);
  const [qty, setQty] = useState<number>(1);
  const disabled = qty < 1 || (hasSizes && !size);

  useEffect(() => {
    if (open) {
      setSize(defaultSelected);
      setQty(1);
    }
  }, [defaultSelected, open]);

  async function handleBuy() {
    if (disabled) {
      return;
    }

    try {
      if (onAddToCart) {
        await onAddToCart({
          id: product.id,
          size: hasSizes ? size : undefined,
          qty,
        });
      }

      toast.success("Produto adicionado ao carrinho");
      onOpenChange(false);
    } catch {
      toast.error("Nao foi possivel adicionar ao carrinho");
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-0">
        <div className="mx-auto w-full max-w-[520px] px-4">
          <DrawerHeader className="relative px-0 pb-3 text-left">
            <DrawerDescription className="sr-only">
              Compra rapida
            </DrawerDescription>

            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar"
                className="absolute right-2 top-4 rounded-full"
              >
                <X className="size-4" />
              </Button>
            </DrawerClose>

            <div
              className="grid items-start gap-2 md:gap-3"
              style={{ gridTemplateColumns: `${IMG_WIDTH}px 1fr` }}
            >
              <div className="space-y-2">
                <div
                  className="relative overflow-hidden rounded-lg bg-primary/10"
                  style={{
                    width: IMG_WIDTH,
                    height: Math.round((IMG_WIDTH * 4) / 3),
                  }}
                >
                  <CommerceImage
                    src={product.image.src}
                    alt={product.image.alt}
                    fill
                    className="object-cover"
                    sizes={`${IMG_WIDTH}px`}
                  />
                </div>

                {hasSizes ? (
                  <SizeSelector onChange={setSize} value={size} sizes={sizes} />
                ) : (
                  <p className="text-xs font-medium text-muted-foreground">
                    Tamanho padrao
                  </p>
                )}
              </div>

              <div className="min-w-0">
                <DrawerTitle className="truncate leading-tight">
                  {product.title}
                </DrawerTitle>
                <div className="mt-1 flex items-baseline gap-2">
                  {typeof product.originalPrice === "number" &&
                  product.originalPrice > product.price ? (
                    <span className="text-sm text-muted-foreground line-through">
                      {currency(product.originalPrice)}
                    </span>
                  ) : null}
                  <span className="text-xl font-extrabold">
                    {currency(product.price)}
                  </span>
                </div>
              </div>
            </div>
          </DrawerHeader>

          <Separator />

          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => setQty((currentQty) => Math.max(1, currentQty - 1))}
                  aria-label="Diminuir"
                >
                  -
                </Button>
                <div className="w-10 text-center text-base font-semibold">
                  {qty}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-10"
                  onClick={() => setQty((currentQty) => Math.min(99, currentQty + 1))}
                  aria-label="Aumentar"
                >
                  +
                </Button>
              </div>

              <Button className="h-10 flex-1" onClick={handleBuy} disabled={disabled}>
                Comprar
              </Button>
            </div>
          </div>

          <DrawerFooter className="px-0 pb-4">
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
