"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CommerceImage } from "@/components/ui/commerce-image";
import { Star, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ProductReviewsProps = {
  productId: string;
};

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const iconSize = size === "sm" ? "size-4" : "size-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={cn(
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"
          )}
        >
          <Star
            className={cn(
              iconSize,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Review = any;

export function ProductReviews({ productId }: ProductReviewsProps) {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      setReviews(data ?? []);
      setLoading(false);
    }

    void fetchReviews();
  }, [productId, supabase]);

  function addImageUrl() {
    const url = newImageUrl.trim();
    if (!url || imageUrls.length >= 5) return;
    try {
      new URL(url);
      setImageUrls((prev) => [...prev, url]);
      setNewImageUrl("");
    } catch {
      toast.error("URL de imagem invalida");
    }
  }

  function removeImageUrl(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!userId) {
      toast.error("Faca login para avaliar");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: userId,
        rating,
        title: title || null,
        comment: comment || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Avaliacao enviada! Aguarde a aprovacao.");
      setShowForm(false);
      setRating(5);
      setTitle("");
      setComment("");
      setImageUrls([]);
    } catch {
      toast.error("Erro ao enviar avaliacao. Verifique se ja comprou este produto.");
    } finally {
      setSubmitting(false);
    }
  }

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + (Number(r.rating) || 0), 0) /
        reviews.length
      : 0;

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Avaliacoes</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <StarRating value={Math.round(averageRating)} readonly size="sm" />
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({reviews.length}{" "}
                {reviews.length === 1 ? "avaliacao" : "avaliacoes"})
              </span>
            </div>
          )}
        </div>

        {userId && !showForm && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowForm(true)}
          >
            Avaliar
          </Button>
        )}
      </div>

      {showForm && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nota</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Titulo (opcional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resumo da avaliacao"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Comentario (opcional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte sua experiencia..."
              rows={3}
            />
          </div>

          {/* Image URLs */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fotos (opcional, ate 5)</label>
            {imageUrls.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative size-16 rounded-md overflow-hidden border">
                    <CommerceImage src={url} alt={`Foto ${idx + 1}`} fill className="object-cover" sizes="64px" />
                    <button
                      type="button"
                      onClick={() => removeImageUrl(idx)}
                      className="absolute top-0 right-0 rounded-bl-md bg-black/50 p-0.5 text-white"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageUrls.length < 5 && (
              <div className="flex gap-2">
                <Input
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Cole a URL da imagem"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addImageUrl}>
                  <ImagePlus className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showForm ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliacao ainda.
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: Review) => {
            const reviewImages = (review.image_urls as string[] | null) ?? [];

            return (
              <div key={review.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <StarRating
                    value={Number(review.rating) || 0}
                    readonly
                    size="sm"
                  />
                  {review.created_at && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                {review.title && (
                  <p className="text-sm font-semibold">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                )}
                {reviewImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {reviewImages.map((url: string, idx: number) => (
                      <div
                        key={idx}
                        className="relative size-20 overflow-hidden rounded-lg border"
                      >
                        <CommerceImage
                          src={url}
                          alt={`Foto da avaliacao ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    ))}
                  </div>
                )}
                <Separator />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
