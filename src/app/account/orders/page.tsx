import Link from "next/link";
import { Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrders } from "@/actions/orders";
import { currency, cn } from "@/lib/utils";
import { CancelOrderButton } from "./cancel-order-button";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "Pendente", className: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Confirmado", className: "bg-blue-100 text-blue-800" },
  processing: {
    label: "Processando",
    className: "bg-blue-100 text-blue-800",
  },
  shipped: { label: "Enviado", className: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregue", className: "bg-green-100 text-green-800" },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800",
  },
  refunded: {
    label: "Reembolsado",
    className: "bg-gray-100 text-gray-800",
  },
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Meus pedidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe o status dos seus pedidos
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Voce ainda nao fez nenhum pedido.
          </p>
          <Button asChild>
            <Link href="/products">Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] ?? {
              label: order.status,
              className: "bg-gray-100 text-gray-800",
            };
            return (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">
                      Pedido #{order.id.slice(0, 8)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")} -{" "}
                    {currency(order.total)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === "pending" ? (
                    <CancelOrderButton orderId={order.id} />
                  ) : null}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/account/orders/${order.id}`}>
                      <Eye className="mr-1 size-3.5" />
                      Detalhes
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
