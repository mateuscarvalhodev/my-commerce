"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type WishlistToggleProps = {
  productId: string;
  className?: string;
  iconOnly?: boolean;
};

type WishlistItem = {
  id: string;
  product_id: string;
};

export function WishlistToggle({ productId, className, iconOnly }: WishlistToggleProps) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    if (!userId) return;

    supabase
      .from("wishlist")
      .select("id, product_id")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) {
          setWishlistItems(data);
        }
      });
  }, [userId, supabase]);

  const isInWishlist = useMemo(() => {
    return wishlistItems.some((item) => String(item.product_id) === productId);
  }, [wishlistItems, productId]);

  async function handleToggle() {
    if (!userId) {
      toast.error("Faca login para adicionar a lista de desejos");
      return;
    }

    setIsPending(true);
    try {
      if (isInWishlist) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", userId);

        setWishlistItems((prev) => prev.filter((item) => String(item.product_id) !== productId));
        toast.success("Removido da lista de desejos");
      } else {
        const { data } = await supabase
          .from("wishlist")
          .insert({ product_id: productId, user_id: userId })
          .select("id, product_id")
          .single();

        if (data) {
          setWishlistItems((prev) => [...prev, data]);
        }
        toast.success("Adicionado a lista de desejos!");
      }
    } catch {
      toast.error("Erro ao atualizar lista de desejos");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 text-sm transition-colors",
        isInWishlist
          ? "text-red-500 hover:text-red-600"
          : "text-muted-foreground hover:text-red-500",
        className
      )}
    >
      <Heart
        className={cn("size-5", isInWishlist && "fill-current")}
      />
      {!iconOnly && (isInWishlist ? "Na lista de desejos" : "Adicionar a lista de desejos")}
    </button>
  );
}
