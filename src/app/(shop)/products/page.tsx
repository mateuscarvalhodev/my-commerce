import type { Metadata } from "next";
import { ProductsCatalogPage } from "./products-catalog-page";

export const metadata: Metadata = {
  title: "Catalogo | MyCommerce",
  description: "Catalogo",
};

export default function ProductsPage() {
  return <ProductsCatalogPage />;
}
