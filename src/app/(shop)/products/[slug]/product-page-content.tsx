"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { CommerceImage } from "@/components/ui/commerce-image";
import { ProductReviews } from "@/components/ProductReviews";
import { WishlistToggle } from "@/components/WishlistToggle";
import { currency } from "@/utils/currency";
import { cn } from "@/lib/utils";
import { ProductActions } from "./product-actions";

type ProductPageContentProps = {
  slug: string;
};

type DbColorImage = { id: string; url: string; position: number };
type DbColorVariant = {
  id: string;
  size?: string | null;
  sku?: string | null;
  price_delta?: number;
  stock?: number;
  is_active?: boolean;
};
type DbProductColor = {
  id: string;
  name: string;
  hex: string;
  position: number;
  images: DbColorImage[];
  variants: DbColorVariant[];
};

type DbProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  description?: string | null;
  image_url?: string | null;
  stock?: number;
  category?: { id: string; name: string } | null;
  images?: { url: string; alt?: string | null; is_primary?: boolean }[];
  variants?: {
    id: string;
    name?: string | null;
    color?: string | null;
    size?: string | null;
    price_delta?: number;
    stock?: number;
  }[];
  product_colors?: DbProductColor[];
};

function ProductPageSkeleton() {
  return (
    <div className="container mx-auto space-y-8 p-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Skeleton className="aspect-[3/4] w-full rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductPageContent({ slug }: ProductPageContentProps) {
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("products")
          .select(
            "*, category:categories(*), images:product_images(*), variants:product_variants(*), product_colors(*, images:product_images(*), variants:product_variants(*))"
          )
          .eq("slug", slug)
          .single();

        if (queryError || !data) {
          setError("Produto não encontrado");
          return;
        }

        setProduct(data as unknown as DbProduct);
      } catch {
        setError("Não foi possível carregar o produto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-black">Produto não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Não conseguimos encontrar o produto solicitado.
        </p>
        <Button asChild>
          <Link href="/products">Ver outros produtos</Link>
        </Button>
      </main>
    );
  }

  const productColors = (product.product_colors ?? []).sort(
    (a, b) => a.position - b.position
  );
  const hasColors = productColors.length > 0;

  const activeColor = hasColors
    ? productColors.find((c) => c.id === selectedColorId) ?? productColors[0]
    : null;

  // Images: if product has colors, show selected color's images; otherwise legacy
  const images: string[] = [];
  if (activeColor && activeColor.images.length > 0) {
    activeColor.images
      .sort((a, b) => a.position - b.position)
      .forEach((img) => {
        if (img.url) images.push(img.url);
      });
  } else {
    const legacyImages = (product.images ?? []).map((img) => img.url).filter(Boolean);
    if (legacyImages.length > 0) {
      images.push(...legacyImages);
    } else if (product.image_url) {
      images.push(product.image_url);
    }
  }

  const pixPercent = 10;
  const pixPrice = product.price * (1 - pixPercent / 100);
  const installments = 5;
  const installmentValue = product.price / installments;

  // Variants: if color is active, use its variants; otherwise legacy
  const currentVariants = activeColor
    ? (activeColor.variants ?? [])
        .filter((v) => v.is_active !== false)
        .map((v) => ({
          id: v.id,
          size: v.size ?? undefined,
          color: activeColor.name,
          priceDelta: v.price_delta ?? 0,
          stock: v.stock ?? 0,
        }))
    : (product.variants ?? []).map((v) => ({
        id: v.id,
        size: v.size ?? undefined,
        color: v.color ?? undefined,
        priceDelta: v.price_delta ?? 0,
        stock: v.stock ?? 0,
      }));

  const sizes = Array.from(
    new Set(currentVariants.map((v) => v.size).filter(Boolean))
  ) as string[];

  function handleColorSelect(colorId: string) {
    setSelectedColorId(colorId);
    setSelectedImage(0);
  }

  return (
    <div className="container mx-auto space-y-8 p-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border">
            {images[selectedImage] ? (
              <CommerceImage
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">Sem imagem</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                    idx === selectedImage
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <CommerceImage
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-xl font-extrabold tracking-tight lg:text-2xl">
            {product.name}
          </h1>

          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold">
                {currency(product.price)}
              </span>

              {product.compare_at_price &&
              product.compare_at_price > product.price ? (
                <span className="text-sm text-muted-foreground line-through">
                  {currency(product.compare_at_price)}
                </span>
              ) : null}

              <span className="text-xs font-semibold text-emerald-600">
                {pixPercent}% OFF no Pix
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currency(pixPrice)} à vista no Pix
            </p>
            <p className="text-xs text-muted-foreground">
              {installments}x de {currency(installmentValue)} sem juros
            </p>
          </div>

          {product.description ? (
            <p className="text-sm text-muted-foreground">
              {product.description}
            </p>
          ) : null}
          <Separator />

          {hasColors && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Cor: <span className="font-normal">{activeColor?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {productColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => handleColorSelect(color.id)}
                    title={color.name}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      (activeColor?.id ?? productColors[0]?.id) === color.id
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-muted hover:border-foreground/40"
                    )}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <ProductActions
            product={{
              id: product.id,
              title: product.name,
              price: product.price,
              image: {
                src: images[0] ?? product.image_url ?? "",
                alt: product.name,
              },
            }}
            sizes={sizes}
            variants={currentVariants}
          />

          <WishlistToggle productId={String(product.id)} />
        </div>
      </div>

      <Separator />

      <ProductReviews productId={String(product.id)} />
    </div>
  );
}
