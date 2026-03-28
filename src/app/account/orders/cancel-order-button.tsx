"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/actions/orders";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;

    setLoading(true);
    try {
      await cancelOrder(orderId);
      toast.success("Pedido cancelado com sucesso");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao cancelar pedido"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      disabled={loading}
      onClick={handleCancel}
    >
      {loading ? (
        <Loader2 className="mr-1 size-3.5 animate-spin" />
      ) : (
        <XCircle className="mr-1 size-3.5" />
      )}
      Cancelar
    </Button>
  );
}
