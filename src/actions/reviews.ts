"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProductReviews(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("*, user:profiles(name, image_url)")
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function createReview(data: {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Avaliacao deve ser entre 1 e 5");
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      product_id: data.productId,
      user_id: user.id,
      rating: data.rating,
      title: data.title ?? null,
      comment: data.comment ?? null,
      is_approved: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return review;
}
