"use client";

import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CartProvider } from "@/context/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <CartProvider>
        {children}
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </SidebarProvider>
  );
}
