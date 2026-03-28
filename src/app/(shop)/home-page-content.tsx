"use client";

import { useEffect, useMemo, useState } from "react";
import CatalogGrid from "@/components/CatalogGrid";
import { Highlights } from "@/components/Highlights";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { mapSupabaseProductToCatalogProduct } from "@/lib/commerce/mappers";

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

export function HomePageContent() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rawProducts, setRawProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from("products")
        .select("*, images:product_images(*)")
        .eq("is_active", true)
        .limit(8);

      if (queryError) {
        setError("Nao foi possivel carregar os produtos");
      } else {
        setRawProducts(data ?? []);
      }
      setLoading(false);
    }

    void fetchProducts();
  }, [supabase]);

  const products = useMemo(
    () => rawProducts.map(mapSupabaseProductToCatalogProduct),
    [rawProducts],
  );

  return (
    <>
      <Highlights />
      <Separator />
      {loading ? (
        <HomeCatalogSkeleton />
      ) : (
        <CatalogGrid
          title="Catalogo"
          subtitle={
            error
              ? error
              : "Produtos carregados"
          }
          products={products}
          emptyMessage="Nenhum produto retornado."
        />
      )}
    </>
  );
}
