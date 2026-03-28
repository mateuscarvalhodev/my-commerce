"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getProducts, getCategories } from "@/actions/products";
import { currency } from "@/utils/currency";

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
  description?: string | null;
};

type HighlightCategoryPageContentProps = {
  slug: string;
};

function HighlightCatalogSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border bg-white p-3">
            <Skeleton className="aspect-[4/5] w-full rounded-xl" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HighlightCategoryPageContent({
  slug,
}: HighlightCategoryPageContentProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = useMemo(
    () =>
      categories.find(
        (cat) => cat.slug === slug || cat.id === slug
      ) ?? null,
    [categories, slug]
  );

  useEffect(() => {
    async function load() {
      try {
        const categoriesResult = await getCategories();
        setCategories(categoriesResult as Category[]);

        const matchedCat = (categoriesResult as Category[]).find(
          (cat) => cat.slug === slug || cat.id === slug
        );

        if (matchedCat) {
          const productsResult = await getProducts({
            category: matchedCat.id,
            limit: 100,
          });
          setProducts(productsResult.data as Product[]);
        }
      } catch {
        setError("Nao foi possivel carregar a categoria");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return <HighlightCatalogSkeleton />;
  }

  if (!category) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-black">Categoria nao encontrada</h1>
        <p className="text-sm text-muted-foreground">
          Nao encontramos a categoria solicitada.
        </p>
        <Button asChild>
          <Link href="/">Voltar para a home</Link>
        </Button>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-black">Nao foi possivel carregar a categoria</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button asChild>
          <Link href="/">Voltar para a home</Link>
        </Button>
      </main>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-sm text-muted-foreground">{category.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <ShoppingBag className="size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nao encontramos produtos para esta categoria.
          </p>
        </div>
      ) : (
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
  );
}
