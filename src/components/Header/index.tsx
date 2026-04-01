"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Menu, ChevronLeft, Search, ShoppingCart, X } from "lucide-react";
import { Input } from "@/components/ui/input";

import { CartDrawer } from "@/components/CartDrawer";
import { useCart } from "@/context/cart-context";
import { useRef, useState } from "react";

type HeaderProps = { showBack?: boolean; title?: string };

const ROOT_PATHS = ["/", "/products"];

function HeaderInner({ showBack, title }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { totalQty } = useCart();
  const [openCart, setOpenCart] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/products?search=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  }

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => searchRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  const hasCategory = searchParams.get("category");
  const isDeepPage =
    showBack ??
    (!ROOT_PATHS.includes(pathname) || !!hasCategory);

  const displayTitle = title ?? "FitStyle";

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex items-center gap-2 px-4 py-3">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeSearch}
                aria-label="Fechar busca"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="flex-1"
              />
              <Button type="submit" variant="ghost" size="icon" aria-label="Buscar">
                <Search className="size-5" />
              </Button>
            </form>
          ) : (
            <>
              <div className="shrink-0">
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

              <div className="flex-1 text-center">
                <Link href="/" className="font-bold text-lg">
                  {displayTitle}
                </Link>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button variant="ghost" size="icon" aria-label="Pesquisar" onClick={openSearch}>
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
                    <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-fuchsia-600 px-1 text-center text-[10px] font-bold text-white">
                      {totalQty}
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </header>
      <div className="h-13" />

      <CartDrawer open={openCart} onOpenChange={setOpenCart} />
    </>
  );
}

export const Header = HeaderInner;
