import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/actions/products";
import { currency } from "@/lib/utils";

export default async function HomePage() {
  const { data: products } = await getProducts({ limit: 8 });

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
            Bem-vindo ao MyCommerce
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Encontre os melhores produtos com os melhores precos. Entrega rapida
            e pagamento seguro.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/products">
              Ver produtos
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight">
            Produtos em destaque
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/products">
              Ver todos
              <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Nenhum produto disponivel no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                  <h3 className="font-semibold leading-tight line-clamp-2">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
