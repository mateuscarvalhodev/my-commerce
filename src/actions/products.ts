"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProducts(params?: {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  const supabase = await createClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select(
      "*, category:categories(*), product_images(*), product_colors(*, images:product_images(*), variants:product_variants(*))",
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  if (params?.category) {
    query = query.eq("category_id", params.category);
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  const total = count ?? 0;

  return {
    data: data ?? [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(*), product_images(*), product_variants(*), product_colors(*, images:product_images(*), variants:product_variants(*))"
    )
    .eq("slug", slug)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);

  return data ?? [];
}
