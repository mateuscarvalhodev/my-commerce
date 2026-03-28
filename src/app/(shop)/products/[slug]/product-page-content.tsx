"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getProductBySlug } from "@/actions/products";
import { getProductReviews } from "@/actions/reviews";
import { toggleWishlist, isInWishlist } from "@/actions/wishlist";
import { currency } from "@/utils/currency";
import { cn } from "@/lib/utils";
import { ProductActions } from "./product-actions";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";

type ProductPageContentProps = {
  slug: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  description?: string | null;
  image_url?: string | null;
  stock?: number;
  product_images?: { url: string; alt?: string; is_primary?: boolean }[];
  product_variants?: { id: string; name?: string; color?: string; size?: string; price_delta?: number; stock?: number }[];
  category?: { id: string; name: string } | null;
};

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  created_at: string;
  user?: { name?: string | null; image_url?: string | null } | null;
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
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const productData = await getProductBySlug(slug);
        setProduct(productData as Product);

        const [reviewsData, wishlistStatus] = await Promise.all([
          getProductReviews(productData.id).catch(() => []),
          isInWishlist(productData.id).catch(() => false),
        ]);
        setReviews(reviewsData as Review[]);
        setInWishlist(wishlistStatus);
      } catch {
        setError("Produto nao encontrado");
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
        <h1 className="text-2xl font-black">Produto nao encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Nao conseguimos encontrar o produto solicitado.
        </p>
        <Button asChild>
          <Link href="/products">Ver outros produtos</Link>
        </Button>
      </main>
    );
  }

  const images = (product.product_images ?? []).map((img) => img.url).filter(Boolean);
  if (images.length === 0 && product.image_url) {
    images.push(product.image_url);
  }

  const pixPercent = 10;
  const pixPrice = product.price * (1 - pixPercent / 100);
  const installments = 5;
  const installmentValue = product.price / installments;

  const sizes = Array.from(
    new Set((product.product_variants ?? []).map((v) => v.size).filter(Boolean))
  ) as string[];

  const variants = (product.product_variants ?? []).map((v) => ({
    id: v.id,
    size: v.size ?? undefined,
    color: v.color ?? undefined,
    priceDelta: v.price_delta ?? 0,
    stock: v.stock ?? 0,
  }));

  async function handleToggleWishlist() {
    try {
      const result = await toggleWishlist(product!.id);
      setInWishlist(result.added);
      toast.success(result.added ? "Adicionado a lista de desejos" : "Removido da lista de desejos");
    } catch {
      toast.error("Faca login para usar a lista de desejos");
    }
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="container mx-auto space-y-8 p-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl border">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="size-full object-cover"
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
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="size-full object-cover"
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

          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.length})
              </span>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold">
                {currency(product.price)}
              </span>

              {product.compare_at_price && product.compare_at_price > product.price ? (
                <span className="text-sm text-muted-foreground line-through">
                  {currency(product.compare_at_price)}
                </span>
              ) : null}

              <span className="text-xs font-semibold text-emerald-600">
                {pixPercent}% OFF no Pix
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {currency(pixPrice)} a vista no Pix
            </p>
            <p className="text-xs text-muted-foreground">
              {installments}x de {currency(installmentValue)} sem juros
            </p>
          </div>

          {product.description ? (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          ) : null}
          <Separator />

          <ProductActions
            product={{
              id: product.id,
              title: product.name,
              price: product.price,
            }}
            sizes={sizes}
            variants={variants}
          />

          <button
            type="button"
            onClick={() => void handleToggleWishlist()}
            className={cn(
              "flex items-center gap-2 text-sm transition-colors",
              inWishlist
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart className={cn("size-5", inWishlist && "fill-current")} />
            {inWishlist ? "Na lista de desejos" : "Adicionar a lista de desejos"}
          </button>
        </div>
      </div>

      <Separator />

      {/* Reviews */}
      <section>
        <h2 className="text-xl font-bold">
          Avaliacoes ({reviews.length})
        </h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma avaliacao ainda.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {review.user?.name ?? "Cliente"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {review.title && (
                  <p className="mt-2 font-semibold">{review.title}</p>
                )}
                {review.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
