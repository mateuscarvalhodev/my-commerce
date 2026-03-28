"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, ChevronLeft, Search, ShoppingCart } from "lucide-react";

import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/context/cart-context";
import { Suspense, useState } from "react";

type HeaderProps = { showBack?: boolean; title?: string };

const ROOT_PATHS = ["/", "/products"];

function HeaderInner({ showBack, title }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalQty } = useCart();
  const [openCart, setOpenCart] = useState(false);

  const hasCategory = searchParams.get("category");
  const isDeepPage =
    showBack ??
    (!ROOT_PATHS.includes(pathname) || !!hasCategory);

  const displayTitle = title ?? "FitStyle";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto grid grid-cols-3 items-center gap-2 px-4 py-3">
          <div className="justify-self-start">
            {isDeepPage ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label="Voltar"
              >
                <ChevronLeft className="size-5" />
              </Button>
            ) : (
              <SidebarTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Abrir menu">
                  <Menu className="size-5" />
                </Button>
              </SidebarTrigger>
            )}
          </div>

          <div className="justify-self-center">
            <span className="font-bold text-lg">
              {displayTitle}
            </span>
          </div>

          <div className="justify-self-end flex items-center gap-1.5">
            <Button variant="ghost" size="icon" aria-label="Pesquisar">
              <Search className="size-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Carrinho"
              type="button"
              onClick={() => setOpenCart(true)}
              className="relative"
            >
              <ShoppingCart className="size-5" />
              {totalQty > 0 && (
                <span className="absolute -right-1 -top-1 min-w-[16px] rounded-full bg-fuchsia-600 px-1 text-center text-[10px] font-bold text-white">
                  {totalQty}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <CartDrawer open={openCart} onOpenChange={setOpenCart} />
    </>
  );
}

export const Header = (props: HeaderProps) => (
  <Suspense>
    <HeaderInner {...props} />
  </Suspense>
);
