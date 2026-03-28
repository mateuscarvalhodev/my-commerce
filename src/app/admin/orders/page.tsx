"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
import { getAdminOrders, updateOrderStatus } from "@/actions/admin";
import type { OrderStatus } from "@/types/database";

interface AdminOrder {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  user: { name: string | null; email: string } | null;
}

const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-red-100 text-red-700",
  paid: "bg-green-100 text-green-700",
};

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const result = await getAdminOrders();
      setOrders(result.data as AdminOrder[]);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: OrderStatus) {
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  }

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s] ?? s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Cliente</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-left font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr
                  key={order.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    {order.user?.name ?? order.user?.email ?? "---"}
                  </td>
                  <td className="px-4 py-3">{currency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusBadge[order.status] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {order.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(order.id, "confirmed")
                          }
                        >
                          Confirmar
                        </Button>
                      )}
                      {(order.status === "confirmed" ||
                        order.status === "processing") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(order.id, "shipped")
                          }
                        >
                          Enviar
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(order.id, "delivered")
                          }
                        >
                          Entregue
                        </Button>
                      )}
                      {order.status !== "cancelled" &&
                        order.status !== "delivered" &&
                        order.status !== "refunded" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() =>
                              handleStatusChange(order.id, "cancelled")
                            }
                          >
                            Cancelar
                          </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
