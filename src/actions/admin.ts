"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Acesso negado");

  return { supabase, user };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminStats() {
  await requireAdmin();
  const admin = createAdminClient();

  const [ordersResult, productsResult, customersResult, revenueResult] =
    await Promise.all([
      admin.from("orders").select("*", { count: "exact", head: true }),
      admin
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      admin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "customer"),
      admin
        .from("orders")
        .select("total")
        .in("status", ["paid", "shipped", "delivered"]),
    ]);

  const revenue = (revenueResult.data ?? []).reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  return {
    totalOrders: ordersResult.count ?? 0,
    totalProducts: productsResult.count ?? 0,
    totalCustomers: customersResult.count ?? 0,
    totalRevenue: revenue,
  };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getAdminOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("orders")
    .select("*, user:profiles(name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.status) {
    query = query.eq("status", params.status);
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

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAdminProducts(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("products")
    .select("*, category:categories(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.search) {
    query = query.ilike("name", `%${params.search}%`);
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

export async function createProduct(data: {
  name: string;
  slug: string;
  description: string;
  price: number;
  stock?: number;
  image_url: string;
  category_id: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  is_active?: boolean;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: product, error } = await admin
    .from("products")
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      stock: data.stock ?? 0,
      image_url: data.image_url,
      category_id: data.category_id,
      weight: data.weight ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      length: data.length ?? null,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return product;
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    image_url: string;
    category_id: string;
    weight: number;
    width: number;
    height: number;
    length: number;
    is_active: boolean;
  }>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: product, error } = await admin
    .from("products")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return product;
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data;
}

// ─── Customers ────────────────────────────────────────────────────────────────

export async function getAdminCustomers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
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

// ─── Coupons ──────────────────────────────────────────────────────────────────

export async function getAdminCoupons() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function createCoupon(data: {
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_value?: number;
  max_uses?: number;
  is_active?: boolean;
  expires_at?: string;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: coupon, error } = await admin
    .from("coupons")
    .insert({
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      min_order_value: data.min_order_value ?? null,
      max_uses: data.max_uses ?? null,
      is_active: data.is_active ?? true,
      expires_at: data.expires_at ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return coupon;
}

export async function updateCoupon(
  id: string,
  data: Partial<{
    code: string;
    type: "percent" | "fixed";
    value: number;
    min_order_value: number;
    max_uses: number;
    is_active: boolean;
    expires_at: string;
  }>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const updateData = { ...data, updated_at: new Date().toISOString() };
  if (updateData.code) {
    updateData.code = updateData.code.toUpperCase();
  }

  const { data: coupon, error } = await admin
    .from("coupons")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return coupon;
}

export async function deleteCoupon(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("coupons").delete().eq("id", id);

  if (error) throw new Error(error.message);

  return { success: true };
}
