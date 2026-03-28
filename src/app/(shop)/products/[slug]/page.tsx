import { notFound } from "next/navigation";
import { ShoppingBag, Star, CheckCircle, XCircle } from "lucide-react";
import { getProductBySlug } from "@/actions/products";
import { getProductReviews } from "@/actions/reviews";
import { currency } from "@/lib/utils";
import { AddToCartButton } from "./add-to-cart-button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const reviews = await getProductReviews(product.id);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const primaryImage = product.product_images?.find(
    (img: any) => img.is_primary
  ) ?? product.product_images?.[0];

  const hasVariants =
    product.product_variants && product.product_variants.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-2xl border bg-muted shadow-sm">
          {primaryImage?.url ? (
            <img
              src={primaryImage.url}
              alt={primaryImage.alt ?? product.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ShoppingBag className="size-16 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.category ? (
            <p className="text-sm text-muted-foreground">
              {product.category.name}
            </p>
          ) : null}

          <h1 className="text-3xl font-black tracking-tight">
            {product.name}
          </h1>

          {reviews.length > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({reviews.length} avaliacao{reviews.length !== 1 ? "es" : ""})
              </span>
            </div>
          ) : null}

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-primary">
              {currency(product.price)}
            </span>
            {product.compare_at_price ? (
              <span className="text-lg text-muted-foreground line-through">
                {currency(product.compare_at_price)}
              </span>
            ) : null}
          </div>

          {/* Stock status */}
          <div className="flex items-center gap-2 text-sm">
            {product.stock > 0 ? (
              <>
                <CheckCircle className="size-4 text-green-600" />
                <span className="text-green-700">
                  Em estoque ({product.stock} disponiveis)
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-4 text-destructive" />
                <span className="text-destructive">Esgotado</span>
              </>
            )}
          </div>

          {product.description ? (
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          {/* Add to cart */}
          <AddToCartButton
            productId={product.id}
            disabled={product.stock <= 0}
            variants={hasVariants ? product.product_variants : undefined}
          />
        </div>
      </div>

      {/* Reviews section */}
      <section className="mt-16">
        <h2 className="text-xl font-black tracking-tight">
          Avaliacoes ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhuma avaliacao ainda.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
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
                        className={`size-3.5 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
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
                {review.title ? (
                  <p className="mt-2 font-semibold">{review.title}</p>
                ) : null}
                {review.comment ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
