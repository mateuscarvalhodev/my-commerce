import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts, getCategories } from "@/actions/products";
import { currency, cn } from "@/lib/utils";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  const [{ data: products, totalPages, total }, categories] = await Promise.all(
    [
      getProducts({
        search: params.search,
        category: params.category,
        page: currentPage,
        limit: 12,
      }),
      getCategories(),
    ]
  );

  function buildUrl(overrides: Record<string, string | undefined>) {
    const merged = { ...params, ...overrides };
    const qs = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    return `/products?${qs.toString()}`;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-black tracking-tight">Produtos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {total} produto{total !== 1 ? "s" : ""} encontrado
        {total !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Search */}
          <form className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Buscar produtos..."
              defaultValue={params.search}
              className="pl-9"
            />
            {params.category ? (
              <input type="hidden" name="category" value={params.category} />
            ) : null}
          </form>

          {/* Categories */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold">Categorias</h3>
            <div className="space-y-1">
              <Link
                href={buildUrl({ category: undefined, page: undefined })}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm transition-colors",
                  !params.category
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                Todas
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={buildUrl({ category: cat.id, page: undefined })}
                  className={cn(
                    "block rounded-md px-3 py-1.5 text-sm transition-colors",
                    params.category === cat.id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div>
          {products.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingBag className="size-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhum produto encontrado.
              </p>
              <Button variant="outline" asChild>
                <Link href="/products">Limpar filtros</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-square overflow-hidden rounded-t-xl bg-muted">
                      {product.product_images?.[0]?.url ? (
                        <img
                          src={product.product_images[0].url}
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
                      <p className="text-xs text-muted-foreground">
                        {product.category?.name}
                      </p>
                      <h3 className="mt-1 font-semibold leading-tight line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-black text-primary">
                          {currency(product.price)}
                        </span>
                        {product.compare_at_price ? (
                          <span className="text-sm text-muted-foreground line-through">
                            {currency(product.compare_at_price)}
                          </span>
                        ) : null}
                      </div>
                      {product.stock <= 0 ? (
                        <span className="mt-1 inline-block text-xs font-medium text-destructive">
                          Esgotado
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 ? (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {currentPage > 1 ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={buildUrl({ page: String(currentPage - 1) })}
                      >
                        Anterior
                      </Link>
                    </Button>
                  ) : null}
                  <span className="px-3 text-sm text-muted-foreground">
                    Pagina {currentPage} de {totalPages}
                  </span>
                  {currentPage < totalPages ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={buildUrl({ page: String(currentPage + 1) })}
                      >
                        Proxima
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
