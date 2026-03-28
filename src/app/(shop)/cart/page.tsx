import type { Metadata } from "next";
import { CartPageContent } from "./cart-page-content";

export const metadata: Metadata = {
  title: "Carrinho | MyCommerce",
};

export default function CartPage() {
  return <CartPageContent />;
}
