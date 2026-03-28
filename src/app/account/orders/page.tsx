"use client";

import { useEffect, useState } from "react";
import { getOrders, cancelOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, X, RotateCcw } from "lucide-react";
import { currency } from "@/utils/currency";
import { toast } from "sonner";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

type Order = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items?: {
    quantity: number;
    unit_price: number;
    product?: { name: string } | null;
  }[];
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getOrders();
        setOrders(data as Order[]);
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCancel(orderId: string) {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled" } : o
        )
      );
      toast.success("Pedido cancelado!");
    } catch {
      toast.error("Erro ao cancelar pedido");
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum pedido encontrado.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = order.status as OrderStatus;
            const canCancel = status === "pending" || status === "paid";

            return (
              <div key={order.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-mono">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                  <Badge className={statusColors[status] ?? ""} variant="secondary">
                    {statusLabels[status] ?? status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">
                    Total: {currency(Number(order.total))}
                  </span>

                  <div className="flex gap-2">
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200"
                        onClick={() => void handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                      >
                        <X className="mr-1 size-3" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {order.created_at && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
