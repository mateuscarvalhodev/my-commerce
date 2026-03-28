"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CatalogGrid from "@/components/CatalogGrid";
import { getProducts, getCategories } from "@/actions/products";
import { mapSupabaseProductToCatalogProduct } from "@/lib/commerce/mappers";

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

      <CatalogGrid
        products={products.map(mapSupabaseProductToCatalogProduct)}
        emptyMessage="Não encontramos produtos para esta categoria."
      />
    </section>
  );
}
