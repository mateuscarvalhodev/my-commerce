"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, CreditCard, BadgePercent } from "lucide-react";
import { currency } from "@/utils/currency";
import { ProductQuickBuyDrawer } from "@/components/QuickbuyDrawer";
import { useCart } from "@/context/cart-context";
import { CommerceImage } from "@/components/ui/commerce-image";
import type { CommerceImageSource } from "@/lib/commerce/types";
import { WishlistToggle } from "@/components/WishlistToggle";

const PIX_PERCENT_DEFAULT = 10;

type Density = "compact" | "regular";

type ProductCardProps = {
  id: string | number;
  title: string;
  href: string;
  image: CommerceImageSource;
  price: number;
  originalPrice?: number | null;
  promoPercent?: number;
  installments?: number;
  className?: string;
  density?: Density;
  pixPercent?: number;
  loading?: boolean;
  sizes?: string[];
};

export const ProductCard = ({
  id,
  title,
  href,
  image,
  price,
  originalPrice,
  promoPercent,
  installments = 10,
  className,
  density = "compact",
  pixPercent,
  loading = false,
  sizes,
}: ProductCardProps) => {
  const isCompact = density === "compact";
  const [openQuickBuy, setOpenQuickBuy] = React.useState(false);
  const { addItem } = useCart();

  const effectivePixPercent =
    typeof pixPercent === "number" ? pixPercent : PIX_PERCENT_DEFAULT;

  const validPromo =
    typeof promoPercent === "number" && promoPercent > 0 && promoPercent < 100
      ? promoPercent
      : undefined;

  const derivedOriginal = validPromo
    ? price / (1 - validPromo / 100)
    : undefined;

  const showOriginal =
    typeof originalPrice === "number" && originalPrice > price
      ? originalPrice
      : derivedOriginal && derivedOriginal > price
        ? derivedOriginal
        : undefined;

  const pixPrice = price * (1 - effectivePixPercent / 100);
  const installmentValue = price / Math.max(1, installments);

  return (
    <>
      <Card
        className={cn(
          "h-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 shadow-sm transition hover:shadow-md hover:ring-black/10",
          className
        )}
        data-product-id={id}
      >
        <CardContent
          className={cn(
            "grid h-full gap-3",
            isCompact
              ? "grid-rows-[auto,1fr,auto] p-2"
              : "grid-rows-[auto,1fr,auto] p-3"
          )}
        >
          <div className="relative">
            <Link
              href={href}
              aria-label={title}
              className={cn(
                "relative block overflow-hidden rounded-xl bg-primary/10",
                isCompact ? "aspect-4/5" : "aspect-3/4"
              )}
            >
              <CommerceImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-300 hover:scale-[1.03]"
                priority={false}
              />
            </Link>
            <div className="absolute top-2 right-2 z-10">
              <WishlistToggle productId={String(id)} iconOnly className="rounded-full bg-white/80 p-1.5 backdrop-blur-sm" />
            </div>
          </div>

          <div
            className={cn(
              "flex flex-col px-1",
              isCompact ? "gap-1.5" : "gap-2"
            )}
          >
            <Link href={href} className="block">
              <h3
                className={cn(
                  "min-h-10 text-center font-extrabold leading-5 tracking-wide line-clamp-2",
                  isCompact ? "text-xs" : "text-sm"
                )}
              >
                {title}
              </h3>
            </Link>

            <Separator />

            <div
              className={cn(
                "flex items-baseline justify-center gap-2",
                isCompact ? "mt-0.5" : "mt-1"
              )}
            >
              {typeof showOriginal === "number" ? (
                <span
                  className={cn(
                    "text-neutral-500 line-through",
                    isCompact ? "text-xs" : "text-sm"
                  )}
                >
                  {currency(showOriginal)}
                </span>
              ) : null}
              <span
                className={cn(
                  "font-extrabold",
                  isCompact ? "text-base" : "text-lg"
                )}
              >
                {currency(price)}
              </span>
            </div>

            <div
              className={cn(
                "text-center text-neutral-700",
                isCompact ? "text-[10px]" : "text-xs"
              )}
            >
              <span className="inline-flex items-center gap-1">
                <BadgePercent className={cn(isCompact ? "size-3.5" : "size-4")} />
                {currency(pixPrice)}{" "}
                <span className="text-neutral-500">
                  com Pix ({effectivePixPercent}% off)
                </span>
              </span>
            </div>

            <div
              className={cn(
                "text-center text-neutral-700",
                isCompact ? "text-[10px]" : "text-xs"
              )}
            >
              <span className="inline-flex items-center gap-1">
                <CreditCard className={cn(isCompact ? "size-3.5" : "size-4")} />
                {installments}x de {currency(installmentValue)} sem juros
              </span>
            </div>
          </div>

          <div className="px-1">
            <Button
              type="button"
              className={cn(
                "w-full font-semibold",
                isCompact
                  ? "rounded-lg py-3 text-xs"
                  : "rounded-xl py-5 text-sm"
              )}
              disabled={loading}
              onClick={() => setOpenQuickBuy(true)}
            >
              <ShoppingBag
                className={cn("mr-2", isCompact ? "size-3.5" : "size-4")}
              />
              Eu Quero
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProductQuickBuyDrawer
        open={openQuickBuy}
        onOpenChange={setOpenQuickBuy}
        product={{
          id,
          title,
          image,
          price,
          originalPrice: showOriginal,
        }}
        sizes={sizes}
        onAddToCart={async ({ id: productId, size, qty }) => {
          await addItem({
            id: productId,
            title,
            image,
            price,
            originalPrice: showOriginal,
            size,
            qty,
          });
        }}
      />
    </>
  );
};
