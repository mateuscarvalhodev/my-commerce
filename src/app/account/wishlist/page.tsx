import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWishlist } from "@/actions/wishlist";
import { currency } from "@/lib/utils";
import { RemoveWishlistButton } from "./remove-wishlist-button";

export default async function WishlistPage() {
  const items = await getWishlist();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Wishlist</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Produtos que voce salvou para depois
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Heart className="size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Sua wishlist esta vazia.
          </p>
          <Button asChild>
            <Link href="/products">Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const image = product.product_images?.find(
              (img: any) => img.is_primary
            ) ?? product.product_images?.[0];

            return (
              <div
                key={item.id}
                className="group relative rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute right-2 top-2 z-10">
                  <RemoveWishlistButton productId={product.id} />
                </div>

                <Link href={`/products/${product.slug}`}>
                  <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
                    {image?.url ? (
                      <img
                        src={image.url}
                        alt={product.name}
                        className="size-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <ShoppingBag className="size-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-tight line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-lg font-black text-primary">
                      {currency(product.price)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
