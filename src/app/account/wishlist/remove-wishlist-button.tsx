"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/actions/wishlist";

export function RemoveWishlistButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      await toggleWishlist(productId);
      toast.success("Removido da wishlist");
      router.refresh();
    } catch {
      toast.error("Erro ao remover da wishlist");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      className="size-8 rounded-full shadow-sm"
      disabled={loading}
      onClick={handleRemove}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <X className="size-3.5" />
      )}
    </Button>
  );
}
