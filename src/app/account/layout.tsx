"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { User, MapPin, Package, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const accountNav = [
  { href: "/account", label: "Minha conta", icon: User, exact: true },
  { href: "/account/addresses", label: "Endereços", icon: MapPin },
  { href: "/account/orders", label: "Pedidos", icon: Package },
  { href: "/account/wishlist", label: "Lista de desejos", icon: Heart },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(!!user);
    }
    checkAuth();
  }, []);

  if (isSignedIn === null) {
    return null; // Loading
  }

  if (!isSignedIn) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Você precisa estar logado</p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-primary px-6 py-2 text-primary-foreground font-semibold"
          >
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {accountNav.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
