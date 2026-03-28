"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, getCategories } from "@/actions/products";
import { currency } from "@/utils/currency";

function HomeCatalogSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border bg-white p-3"
          >
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </section>
  );
}

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image_url?: string | null;
  product_images?: { url: string; is_primary?: boolean }[];
  description?: string | null;
};

type Category = {
  id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
};

export function HomePageContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts({ limit: 8 }),
          getCategories(),
        ]);
        setProducts(productsResult.data as Product[]);
        setCategories(categoriesResult as Category[]);
      } catch (err) {
        setError("Nao foi possivel carregar os produtos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      {/* Highlights carousel area */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/highlights/${cat.slug ?? cat.id}`}
                className="shrink-0 rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="size-24 overflow-hidden rounded-xl bg-muted">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <ShoppingBag className="size-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center text-sm font-semibold">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Separator />

      {loading ? (
        <HomeCatalogSkeleton />
      ) : error ? (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
        </section>
      ) : (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight">Catalogo</h2>
            <p className="text-sm text-muted-foreground">
              {products.length > 0
                ? "Produtos carregados"
                : "Nenhum produto retornado."}
            </p>
          </div>

          {products.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const image =
                  product.product_images?.find((img) => img.is_primary) ??
                  product.product_images?.[0];
                const imageUrl = image?.url ?? product.image_url;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group overflow-hidden rounded-2xl border bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="size-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <ShoppingBag className="size-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-base font-black text-primary">
                        {currency(product.price)}
                      </span>
                      {product.compare_at_price &&
                      product.compare_at_price > product.price ? (
                        <span className="text-xs text-muted-foreground line-through">
                          {currency(product.compare_at_price)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}
    </>
  );
}
