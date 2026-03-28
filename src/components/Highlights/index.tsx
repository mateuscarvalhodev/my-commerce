"use client";

import { useEffect, useMemo, useState } from "react";
import { GenericCarousel } from "../Carousel";
import { HighlightCard } from "../HighlightsCard";
import { Skeleton } from "../ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { resolveProductImage, getCategorySlug } from "@/lib/commerce/mappers";

type HighlightItem = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | undefined;
  eyebrow: string;
  image: { src: string; alt: string };
};

function HighlightsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-3 text-xl font-semibold">Categorias</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border bg-white p-3">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <Skeleton className="mt-3 h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export const Highlights = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [categories, setCategories] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("id, name, description"),
        supabase.from("products").select("id, name, image_url, category_id"),
      ]);
      setCategories(categoriesRes.data ?? []);
      setProducts(productsRes.data ?? []);
      setLoading(false);
    }

    void fetchData();
  }, [supabase]);

  const items = useMemo(() => {
    return categories
      .map((category) => {
        const categoryId = String(category.id);
        const title = category.name ?? "Categoria";
        const subtitle = category.description ?? undefined;
        const matchingProduct = products.find(
          (product) => String(product.category_id) === categoryId
        );

        if (!categoryId) {
          return null;
        }

        return {
          id: categoryId,
          slug: getCategorySlug(title, categoryId),
          title,
          subtitle,
          eyebrow: "Categoria",
          image: {
            src: resolveProductImage(matchingProduct?.image_url),
            alt: title,
          },
        } satisfies HighlightItem;
      })
      .filter((item): item is HighlightItem => item !== null);
  }, [categories, products]);

  if (loading) {
    return <HighlightsSkeleton />;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-3 text-xl font-semibold">Categorias</h2>

      <GenericCarousel
        items={items}
        itemClassName="
          basis-[82%]
          sm:basis-[58%]
          md:basis-[44%]
          lg:basis-[34%]
          xl:basis-[30%]
        "
        renderItem={(item) => (
          <HighlightCard
            title={item.title}
            href={`/products?category=${item.id}`}
            image={item.image}
            subtitle={item.subtitle}
            eyebrow={item.eyebrow}
            imgAspect="portrait"
          />
        )}
      />
    </section>
  );
};
