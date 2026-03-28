"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWishlist, toggleWishlist } from "@/actions/wishlist";
import { addToCart } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { currency } from "@/utils/currency";
import { toast } from "sonner";

type WishlistItem = {
  id: string;
  product_id: string;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url?: string | null;
    product_images?: { url: string; is_primary?: boolean }[];
  } | null;
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWishlist();
        setItems(data as WishlistItem[]);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleRemove(productId: string) {
    setRemovingId(productId);
    try {
      await toggleWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId && i.product?.id !== productId));
      toast.success("Removido da lista de desejos");
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleAddToCart(productId: string, name: string) {
    try {
      await addToCart(productId, 1);
      toast.success("Adicionado ao carrinho!");
    } catch {
      toast.error("Faça login para adicionar ao carrinho");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Heart className="size-5" />
        <h1 className="text-xl font-bold">Lista de desejos</h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Heart className="mx-auto size-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            Sua lista de desejos está vazia.
          </p>
          <Button asChild variant="outline">
            <Link href="/products">Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const product = item.product;
            if (!product) return null;

            const productId = item.product_id ?? product.id ?? "";
            const image =
              product.product_images?.find((img) => img.is_primary) ??
              product.product_images?.[0];
            const imageUrl = image?.url ?? product.image_url;

            return (
              <div
                key={item.id}
                className="flex gap-3 rounded-lg border p-3"
              >
                <Link href={`/products/${product.slug}`} className="shrink-0">
                  <div className="relative size-20 overflow-hidden rounded-md">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-muted">
                        <ShoppingBag className="size-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-semibold line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm font-bold mt-1">{currency(product.price)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        void handleAddToCart(productId, product.name)
                      }
                    >
                      <ShoppingBag className="mr-1 size-3" />
                      Comprar
                    </Button>
                    <button
                      onClick={() => void handleRemove(productId)}
                      className="rounded p-1 text-muted-foreground hover:text-red-600"
                      disabled={removingId === productId}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
