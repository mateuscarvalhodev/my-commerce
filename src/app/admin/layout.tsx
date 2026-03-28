"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  Star,
  RotateCcw,
  FolderTree,
  ShieldX,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Produtos", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/coupons", label: "Cupons", icon: Ticket },
  { href: "/admin/reviews", label: "Avaliacoes", icon: Star },
  { href: "/admin/returns", label: "Devolucoes", icon: RotateCcw },
  { href: "/admin/categories", label: "Categorias", icon: FolderTree },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<"loading" | "denied" | "admin">("loading");

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setAuthState("denied");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setAuthState("denied");
        return;
      }

      setAuthState("admin");
    }
    checkAdmin();
  }, []);

  if (authState === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </main>
    );
  }

  if (authState === "denied") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldX className="mx-auto size-12 text-muted-foreground/40" />
          <p className="text-lg font-semibold">Acesso negado</p>
          <p className="text-sm text-muted-foreground">
            Apenas administradores podem acessar esta area.
          </p>
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary px-6 py-2 text-primary-foreground font-semibold"
          >
            Voltar a loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {adminNav.map((item) => {
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
