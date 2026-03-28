import { ProductCard } from "@/components/ProductCard";
import type { CatalogProduct } from "@/lib/commerce/types";

type CatalogGridProps = {
  products: CatalogProduct[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
};

export default function CatalogGrid({
  products,
  title,
  subtitle,
  emptyMessage = "Nenhum produto encontrado.",
}: CatalogGridProps) {
  const hasHeader = Boolean(title || subtitle || products.length === 0);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
      {subtitle ? (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      ) : null}

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : null}

      <div
        className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${
          hasHeader ? "mt-6" : ""
        }`}
      >
        {products.map((p) => (
          <ProductCard
            key={p.id}
            density="compact"
            id={p.id}
            title={p.title}
            href={`/products/${p.slug}`}
            image={{ src: p.images[0], alt: p.title }}
            price={p.price}
            originalPrice={p.originalPrice}
            promoPercent={p.promoPercent}
            installments={p.installments}
            pixPercent={p.pixPercent}
            sizes={p.sizes}
          />
        ))}
      </div>
    </section>
  );
}
