"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { createClient } from "@/lib/supabase/client";

type CategoryItem = {
  id: string;
  name: string;
  slug?: string | null;
  image_url?: string | null;
};

function HighlightsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-white p-4 shadow-sm">
            <Skeleton className="size-24 rounded-xl" />
            <Skeleton className="mx-auto mt-2 h-4 w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}

export const Highlights = () => {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Busca categorias + imagem do primeiro produto de cada uma
      const { data: cats } = await supabase
        .from("categories")
        .select("id, name, slug");

      if (!cats || cats.length === 0) {
        setLoading(false);
        return;
      }

      // Para cada categoria, pega a imagem do primeiro produto
      const { data: products } = await supabase
        .from("products")
        .select("category_id, image_url");

      const enriched: CategoryItem[] = cats.map((cat) => {
        const match = products?.find((p) => String(p.category_id) === String(cat.id));
        return {
          id: String(cat.id),
          name: cat.name,
          slug: cat.slug,
          image_url: match?.image_url ?? null,
        };
      });

      setCategories(enriched);
      setLoading(false);
    }

    void fetchData();
  }, [supabase]);

  if (loading) return <HighlightsSkeleton />;
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none" style={{ WebkitOverflowScrolling: "touch" }}>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/highlights/${cat.slug ?? cat.id}`}
            className="flex shrink-0 flex-col items-center rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
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
  );
};
