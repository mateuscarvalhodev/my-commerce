"use server";

import { createClient } from "@/lib/supabase/server";

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");
  return { supabase, user };
}

async function getOrCreateCart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: existingCart } = await supabase
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (existingCart) return existingCart;

  const { data: newCart, error } = await supabase
    .from("carts")
    .insert({ user_id: userId, total: 0 })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return newCart;
}

async function recalculateCartTotal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cartId: string
) {
  const { data: items } = await supabase
    .from("cart_items")
    .select("quantity, price")
    .eq("cart_id", cartId);

  const total = (items ?? []).reduce(
    (sum, item) => sum + item.quantity * Number(item.price),
    0
  );

  await supabase
    .from("carts")
    .update({ total, updated_at: new Date().toISOString() })
    .eq("id", cartId);

  return total;
}

export async function getCart() {
  const { supabase, user } = await getAuthUser();

  const { data: cart } = await supabase
    .from("carts")
    .select(
      "*, cart_items(*, product:products(*), variant:product_variants(*))"
    )
    .eq("user_id", user.id)
    .single();

  if (!cart) {
    return { id: null, total: 0, items: [] };
  }

  return {
    id: cart.id,
    total: cart.total,
    items: cart.cart_items ?? [],
  };
}

export async function addToCart(
  productId: string,
  quantity: number,
  variantId?: string
) {
  const { supabase, user } = await getAuthUser();

  // Get product price
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("price, stock")
    .eq("id", productId)
    .single();

  if (productError || !product) throw new Error("Produto nao encontrado");

  let price = Number(product.price);

  // If variant, get price delta
  if (variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("price_delta, stock")
      .eq("id", variantId)
      .single();

    if (variant) {
      price += Number(variant.price_delta);
    }
  }

  const cart = await getOrCreateCart(supabase, user.id);

  // Check if item already exists in cart
  let existingQuery = supabase
    .from("cart_items")
    .select("*")
    .eq("cart_id", cart.id)
    .eq("product_id", productId);

  if (variantId) {
    existingQuery = existingQuery.eq("variant_id", variantId);
  } else {
    existingQuery = existingQuery.is("variant_id", null);
  }

  const { data: existingItems } = await existingQuery;
  const existingItem = existingItems?.[0];

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQty, price })
      .eq("id", existingItem.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      variant_id: variantId ?? null,
      quantity,
      price,
    });

    if (error) throw new Error(error.message);
  }

  await recalculateCartTotal(supabase, cart.id);

  return { success: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const { supabase, user } = await getAuthUser();

  const cart = await getOrCreateCart(supabase, user.id);

  if (quantity <= 0) {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("cart_id", cart.id);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("cart_id", cart.id);

    if (error) throw new Error(error.message);
  }

  await recalculateCartTotal(supabase, cart.id);

  return { success: true };
}

export async function removeCartItem(itemId: string) {
  const { supabase, user } = await getAuthUser();

  const cart = await getOrCreateCart(supabase, user.id);

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId)
    .eq("cart_id", cart.id);

  if (error) throw new Error(error.message);

  await recalculateCartTotal(supabase, cart.id);

  return { success: true };
}

export async function clearCart() {
  const { supabase, user } = await getAuthUser();

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!cart) return { success: true };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) throw new Error(error.message);

  await supabase
    .from("carts")
    .update({ total: 0, updated_at: new Date().toISOString() })
    .eq("id", cart.id);

  return { success: true };
}
