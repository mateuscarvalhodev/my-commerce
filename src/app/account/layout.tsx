import Link from "next/link";
import { User, Package, MapPin, Heart } from "lucide-react";
import { requireAuth } from "@/lib/supabase/auth";

const NAV_ITEMS = [
  { href: "/account", label: "Perfil", icon: User },
  { href: "/account/orders", label: "Pedidos", icon: Package },
  { href: "/account/addresses", label: "Enderecos", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-1 rounded-xl border bg-white p-3 shadow-sm lg:h-fit">
          <h2 className="mb-3 px-3 text-sm font-semibold text-muted-foreground">
            Minha conta
          </h2>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Icon className="size-4 text-muted-foreground" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        {/* Content */}
        <div>{children}</div>
      </div>
    </main>
  );
}
