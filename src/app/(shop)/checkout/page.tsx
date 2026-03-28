import type { Metadata } from "next";
import { CheckoutPageContent } from "./checkout-page-content";

export const metadata: Metadata = {
  title: "Checkout | MyCommerce",
  description: "Checkout",
};

export default function CheckoutPage() {
  return <CheckoutPageContent />;
}
