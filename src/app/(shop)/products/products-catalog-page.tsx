"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import CatalogGrid from "@/components/CatalogGrid";
import { getProducts, getCategories } from "@/actions/products";
import { mapSupabaseProductToCatalogProduct } from "@/lib/commerce/mappers";
import { currency } from "@/utils/currency";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  description?: string | null;
  image_url?: string | null;
  product_images?: { url: string; is_primary?: boolean }[];
  product_variants?: { id: string; name?: string; color?: string; size?: string; price_delta?: number; stock?: number }[];
  category?: { id: string; name: string } | null;
};

type Category = {
  id: string;
  name: string;
};

function CatalogSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border bg-white p-3 shadow-sm"
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

export function ProductsCatalogPage() {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const deferredSearch = useDeferredValue(search.trim());

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProducts(categoryId?: string | null, searchQuery?: string) {
    try {
      const result = await getProducts({
        category: categoryId ?? undefined,
        search: (!categoryId && searchQuery) ? searchQuery : undefined,
        limit: 100,
      });
      setAllProducts(result.data as Product[]);
    } catch {
      setError("Nao foi possivel carregar o catalogo.");
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getProducts({ limit: 100 }),
          getCategories(),
        ]);
        setAllProducts(productsResult.data as Product[]);
        setCategories(categoriesResult as Category[]);
      } catch {
        setError("Nao foi possivel carregar o catalogo.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadProducts(selectedCategoryId, deferredSearch);
    }
  }, [selectedCategoryId, deferredSearch]);

  // Extract available colors and sizes from all product variants
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    for (const p of allProducts) {
      for (const v of p.product_variants ?? []) {
        if (v.color) colors.add(v.color);
      }
    }
    return Array.from(colors).sort();
  }, [allProducts]);

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    for (const p of allProducts) {
      for (const v of p.product_variants ?? []) {
        if (v.size) sizes.add(v.size);
      }
    }
    return Array.from(sizes).sort();
  }, [allProducts]);

  // Apply all filters
  const products = useMemo(() => {
    let filtered = allProducts;

    // Text search within category
    if (selectedCategoryId && deferredSearch) {
      const normalizedSearch = deferredSearch.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedSearch) ||
          (p.description ?? "").toLowerCase().includes(normalizedSearch)
      );
    }

    // Price range
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((p) =>
        (p.product_variants ?? []).some((v) => v.color && selectedColors.includes(v.color))
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter((p) =>
        (p.product_variants ?? []).some((v) => v.size && selectedSizes.includes(v.size))
      );
    }

    return filtered;
  }, [allProducts, deferredSearch, selectedCategoryId, priceRange, selectedColors, selectedSizes]);

  const maxPrice = useMemo(
    () => Math.max(...allProducts.map((p) => p.price), 1000),
    [allProducts]
  );

  const hasActiveFilters =
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0;

  function clearFilters() {
    setPriceRange([0, maxPrice]);
    setSelectedColors([]);
    setSelectedSizes([]);
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  return (
    <main className="pb-10">
      <section className="mx-auto max-w-7xl space-y-5 px-4 py-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Produtos</h1>
        </div>

        <div className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou descricao"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategoryId ? "outline" : "default"}
                onClick={() => setSelectedCategoryId(null)}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategoryId === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategoryId(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              <SlidersHorizontal className="mr-1 size-3.5" />
              Filtros
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-muted-foreground"
              >
                <X className="mr-1 size-3" />
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="grid gap-4 border-t pt-4 md:grid-cols-3">
              {/* Price range */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Faixa de preco</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    className="h-8 text-xs"
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    className="h-8 text-xs"
                    placeholder="Max"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{currency(priceRange[0])}</span>
                  <span>{currency(priceRange[1])}</span>
                </div>
              </div>

              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Cor</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleColor(color)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selectedColors.includes(color)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Tamanho</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-colors",
                          selectedSizes.includes(size)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
            <p>{error}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  loadProducts(selectedCategoryId, deferredSearch).finally(() =>
                    setLoading(false)
                  );
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {loading ? (
        <CatalogSkeleton />
      ) : (
        <section className="mx-auto max-w-7xl px-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Catalogo</h2>
            <p className="text-sm text-muted-foreground">
              {products.length} produto{products.length !== 1 ? "s" : ""}
            </p>
          </div>

          <CatalogGrid
            products={products.map(mapSupabaseProductToCatalogProduct)}
            emptyMessage="Nenhum produto encontrado para os filtros atuais."
          />
        </section>
      )}
    </main>
  );
}
