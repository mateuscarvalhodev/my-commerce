"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Grid3x3, Layers3, LogIn, X, User, Heart, Package, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type Category = {
  id: string;
  name: string;
};

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const router = useRouter();
  const supabase = createClient();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(!!data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, [supabase]);

  function closeSidebar() {
    if (isMobile) setOpenMobile(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    closeSidebar();
    router.push("/login");
    router.refresh();
  }

  const categoryItems = categories
    .filter((c) => c.id && c.name)
    .map((c) => ({
      title: c.name.toUpperCase(),
      url: `/products?category=${c.id}`,
      icon: Layers3,
    }));

  const menuItems = [
    ...categoryItems,
    { title: "TODOS OS PRODUTOS", url: "/products", icon: Grid3x3 },
  ];

  const accountItems = isSignedIn
    ? [
        { title: "MINHA CONTA", url: "/account", icon: User },
        { title: "MEUS PEDIDOS", url: "/account/orders", icon: Package },
        { title: "LISTA DE DESEJOS", url: "/account/wishlist", icon: Heart },
      ]
    : [];

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="p-0">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            {!isSignedIn ? (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 font-semibold"
                onClick={closeSidebar}
              >
                <LogIn className="size-5" />
                <span>Entrar</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="inline-flex items-center gap-2 font-semibold"
              >
                <LogOut className="size-5" />
                <span>Sair</span>
              </button>
            )}

            {isMobile ? (
              <button
                aria-label="Fechar menu"
                onClick={() => setOpenMobile(false)}
                className="inline-flex items-center justify-center rounded-md p-1 hover:opacity-90"
              >
                <X className="size-5" />
              </button>
            ) : null}
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} onClick={closeSidebar}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {accountItems.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url} onClick={closeSidebar}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
