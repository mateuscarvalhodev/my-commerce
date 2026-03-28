"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type ReturnItem = {
  id: string;
  order_id: string;
  reason: string;
  status: string;
  admin_notes?: string | null;
  created_at: string;
};

type FilterValue = "all" | "requested" | "approved" | "rejected" | "refunded";

const filterTabs: { label: string; value: FilterValue }[] = [
  { label: "Todos", value: "all" },
  { label: "Solicitadas", value: "requested" },
  { label: "Aprovadas", value: "approved" },
  { label: "Rejeitadas", value: "rejected" },
  { label: "Reembolsadas", value: "refunded" },
];

const statusLabels: Record<string, string> = {
  requested: "Solicitada",
  approved: "Aprovada",
  rejected: "Rejeitada",
  refunded: "Reembolsada",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "outline",
  approved: "default",
  rejected: "destructive",
  refunded: "secondary",
};

export default function AdminReturnsPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReturns();
  }, [filter]);

  async function loadReturns() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("returns")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReturns((data ?? []) as ReturnItem[]);
    } catch {
      toast.error("Erro ao carregar devoluções");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("returns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      toast.success("Devolução atualizada");
      await loadReturns();
    } catch {
      toast.error("Erro ao atualizar devolução");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RotateCcw className="size-5" />
        <h1 className="text-2xl font-bold">Devoluções</h1>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 w-fit overflow-x-auto">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab.value)}
            className={cn(
              "whitespace-nowrap",
              filter !== tab.value && "text-muted-foreground"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : returns.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma devolução encontrada.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Motivo</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr key={ret.id} className="border-b">
                  <td className="px-4 py-3 font-mono font-medium">
                    {ret.order_id?.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{ret.reason}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[ret.status ?? ""] ?? "outline"}>
                      {statusLabels[ret.status ?? ""] ?? ret.status ?? ""}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(ret.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {ret.status === "requested" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(ret.id, "approved")}
                          >
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500"
                            onClick={() => handleUpdateStatus(ret.id, "rejected")}
                          >
                            Rejeitar
                          </Button>
                        </>
                      )}
                      {ret.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(ret.id, "refunded")}
                        >
                          Reembolsar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
