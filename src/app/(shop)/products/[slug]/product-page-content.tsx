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
import CatalogGrid from "@/components/CatalogGrid";
import { mapSupabaseProductToCatalogProduct } from "@/lib/commerce/mappers";

type ProductPageContentProps = {
  slug: string;
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
    size?: string | null;
    price_delta?: number;
    stock?: number;
    is_active?: boolean;
  }[];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("products")
          .select(
            "*, category:categories(*), images:product_images(*), variants:product_variants(*)"
          )
          .eq("slug", slug)
          .single();

        if (queryError || !data) {
          setError("Produto não encontrado");
          return;
        }

        setProduct(data as unknown as DbProduct);

        // Fetch related products (same category, excluding current)
        let relatedQuery = supabase
          .from("products")
          .select("*, images:product_images(*), product_variants(*)")
          .eq("is_active", true)
          .neq("id", data.id)
          .limit(4);

        if (data.category_id) {
          relatedQuery = relatedQuery.eq("category_id", data.category_id);
        }

        const { data: related } = await relatedQuery;
        setRelatedProducts(related ?? []);
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

  const images: string[] = [];
  const legacyImages = (product.images ?? []).map((img) => img.url).filter(Boolean);
  if (legacyImages.length > 0) {
    images.push(...legacyImages);
  } else if (product.image_url) {
    images.push(product.image_url);
  }

  const pixPercent = 10;
  const pixPrice = product.price * (1 - pixPercent / 100);
  const installments = 5;
  const installmentValue = product.price / installments;

  const currentVariants = (product.variants ?? [])
    .filter((v) => v.is_active !== false)
    .map((v) => ({
      id: v.id,
      size: v.size ?? undefined,
      priceDelta: v.price_delta ?? 0,
      stock: v.stock ?? 0,
    }));

  const sizes = Array.from(
    new Set(currentVariants.map((v) => v.size).filter(Boolean))
  ) as string[];

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

      {relatedProducts.length > 0 && (
        <CatalogGrid
          products={relatedProducts.map(mapSupabaseProductToCatalogProduct)}
          title="Você também pode gostar"
        />
      )}
    </div>
  );
}
