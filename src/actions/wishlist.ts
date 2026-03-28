"use server";

import { createClient } from "@/lib/supabase/server";

export async function getWishlist() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  const { data, error } = await supabase
    .from("wishlist")
    .select("*, product:products(*, category:categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function toggleWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  if (existing) {
    // Remove from wishlist
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("id", existing.id);

    if (error) throw new Error(error.message);

    return { added: false };
  } else {
    // Add to wishlist
    const { error } = await supabase.from("wishlist").insert({
      user_id: user.id,
      product_id: productId,
    });

    if (error) throw new Error(error.message);

    return { added: true };
  }
}

export async function isInWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .single();

  return !!data;
}
