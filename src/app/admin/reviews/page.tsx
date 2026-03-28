"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Review = {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_approved: boolean;
  created_at: string;
  product?: { name: string } | null;
};

type FilterValue = "all" | "approved" | "pending";

const filterTabs: { label: string; value: FilterValue }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendentes", value: "pending" },
  { label: "Aprovadas", value: "approved" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [filter]);

  async function loadReviews() {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase
        .from("reviews")
        .select("*, product:products(name)")
        .order("created_at", { ascending: false });

      if (filter === "approved") {
        query = query.eq("is_approved", true);
      } else if (filter === "pending") {
        query = query.eq("is_approved", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setReviews((data ?? []) as Review[]);
    } catch {
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId: string) {
    try {
      const supabase = createClient();
      await supabase
        .from("reviews")
        .update({ is_approved: true })
        .eq("id", reviewId);
      toast.success("Avaliação aprovada");
      await loadReviews();
    } catch {
      toast.error("Erro ao aprovar avaliação");
    }
  }

  async function handleReject(reviewId: string) {
    try {
      const supabase = createClient();
      await supabase
        .from("reviews")
        .update({ is_approved: false })
        .eq("id", reviewId);
      toast.success("Avaliação rejeitada");
      await loadReviews();
    } catch {
      toast.error("Erro ao rejeitar avaliação");
    }
  }

  async function handleDelete(reviewId: string) {
    try {
      const supabase = createClient();
      await supabase.from("reviews").delete().eq("id", reviewId);
      toast.success("Avaliação excluída");
      await loadReviews();
    } catch {
      toast.error("Erro ao excluir avaliação");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="size-5" />
        <h1 className="text-2xl font-bold">Avaliações</h1>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        {filterTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={filter === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab.value)}
            className={cn(filter !== tab.value && "text-muted-foreground")}
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
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma avaliação encontrada.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nota</th>
                <th className="px-4 py-3 text-left font-medium">Produto</th>
                <th className="px-4 py-3 text-left font-medium">Título</th>
                <th className="px-4 py-3 text-left font-medium">Comentário</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b">
                  <td className="px-4 py-3">
                    <StarRating rating={review.rating ?? 0} />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {review.product?.name ?? "--"}
                  </td>
                  <td className="px-4 py-3">{review.title}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {review.comment}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={review.is_approved ? "default" : "secondary"}
                    >
                      {review.is_approved ? "Aprovada" : "Pendente"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!review.is_approved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(review.id)}
                          title="Aprovar"
                        >
                          <Check className="size-4 text-green-600" />
                        </Button>
                      )}
                      {review.is_approved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReject(review.id)}
                          title="Rejeitar"
                        >
                          <X className="size-4 text-orange-500" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        title="Excluir"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
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
