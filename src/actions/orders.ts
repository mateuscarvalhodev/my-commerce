"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateShipping } from "@/lib/shipping";

export async function validateCoupon(code: string, subtotal: number) {
  const admin = createAdminClient();

  const { data: coupon, error } = await admin
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !coupon) {
    return { valid: false, message: "Cupom inválido." };
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: "Cupom expirado." };
  }

  if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
    return { valid: false, message: "Cupom esgotado." };
  }

  if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
    return {
      valid: false,
      message: `Pedido mínimo de R$ ${Number(coupon.min_order_value).toFixed(2)} para este cupom.`,
    };
  }

  const discount =
    coupon.type === "percent"
      ? subtotal * (Number(coupon.value) / 100)
      : Number(coupon.value);

  return {
    valid: true,
    discount: Math.min(discount, subtotal),
    type: coupon.type as "percent" | "fixed",
    value: Number(coupon.value),
    message:
      coupon.type === "percent"
        ? `Cupom de ${Number(coupon.value)}% aplicado!`
        : `Cupom de R$ ${Number(coupon.value).toFixed(2)} aplicado!`,
  };
}

export async function createOrder(data: {
  paymentMethod: string;
  shippingAddressId: string;
  couponCode?: string;
  shippingServiceCode?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  // Get cart with items
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select(
      "*, cart_items(*, product:products(*), variant:product_variants(*))"
    )
    .eq("user_id", user.id)
    .single();

  if (cartError || !cart || !cart.cart_items?.length) {
    throw new Error("Carrinho vazio");
  }

  // Validate stock for each item
  for (const item of cart.cart_items) {
    const stock = item.variant
      ? item.variant.stock
      : item.product.stock;

    if (item.quantity > stock) {
      throw new Error(
        `Estoque insuficiente para "${item.product.name}". Disponivel: ${stock}`
      );
    }
  }

  // Calculate subtotal
  let subtotal = cart.cart_items.reduce(
    (sum: number, item: any) => sum + item.quantity * Number(item.price),
    0
  );

  // Apply coupon if provided
  let discount = 0;
  if (data.couponCode) {
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", data.couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (couponError || !coupon) throw new Error("Cupom invalido");

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new Error("Cupom expirado");
    }

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
      throw new Error("Cupom esgotado");
    }

    if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
      throw new Error(
        `Pedido minimo de R$ ${Number(coupon.min_order_value).toFixed(2)} para este cupom`
      );
    }

    if (coupon.type === "percent") {
      discount = subtotal * (Number(coupon.value) / 100);
    } else {
      discount = Number(coupon.value);
    }

    // Increment coupon uses
    await supabase
      .from("coupons")
      .update({ uses_count: coupon.uses_count + 1 })
      .eq("id", coupon.id);
  }

  // Calculate shipping
  const shippingAddress = await supabase
    .from("addresses")
    .select("*")
    .eq("id", data.shippingAddressId)
    .eq("user_id", user.id)
    .single();

  if (shippingAddress.error || !shippingAddress.data) {
    throw new Error("Endereco de entrega nao encontrado");
  }

  // Estimate total weight from cart items
  const totalWeight = cart.cart_items.reduce(
    (sum: number, item: any) =>
      sum + (Number(item.product.weight) || 0.5) * item.quantity,
    0
  );

  const shippingResult = await calculateShipping({
    origin_cep: process.env.STORE_CEP || "01001000",
    destination_cep: shippingAddress.data.zip_code,
    weight_kg: totalWeight,
    length_cm: 30,
    width_cm: 20,
    height_cm: 15,
    order_value: subtotal - discount,
  });

  // Find the selected shipping option or use the first one
  const shippingOption = data.shippingServiceCode
    ? shippingResult.options.find(
        (o) => o.service_code === data.shippingServiceCode
      ) ?? shippingResult.options[0]
    : shippingResult.options[0];

  const shippingCost = shippingOption?.price ?? 0;
  const total = subtotal - discount + shippingCost;

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      total,
      shipping_cost: shippingCost,
      shipping_service: shippingOption?.service_name ?? null,
      shipping_deadline_days: shippingOption?.deadline_days ?? null,
      status: "pending",
      payment_method: data.paymentMethod,
      shipping_address_id: data.shippingAddressId,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Erro ao criar pedido");

  // Create order items
  const orderItems = cart.cart_items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw new Error("Erro ao criar itens do pedido");

  // Decrement stock for each item
  for (const item of cart.cart_items) {
    if (item.variant_id) {
      const { error } = await supabase
        .from("product_variants")
        .update({ stock: item.variant.stock - item.quantity })
        .eq("id", item.variant_id);

      if (error) throw new Error("Erro ao atualizar estoque da variante");
    } else {
      const { error } = await supabase
        .from("products")
        .update({ stock: item.product.stock - item.quantity })
        .eq("id", item.product_id);

      if (error) throw new Error("Erro ao atualizar estoque");
    }
  }

  // Clear cart
  await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  await supabase
    .from("carts")
    .update({ total: 0, updated_at: new Date().toISOString() })
    .eq("id", cart.id);

  return order;
}

export async function getOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  // Get order with items
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, order_items(*, product:products(*), variant:product_variants(*))")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) throw new Error("Pedido nao encontrado");

  if (!["pending", "paid"].includes(order.status)) {
    throw new Error("Pedido nao pode ser cancelado neste status");
  }

  // Restore stock for each item
  for (const item of order.order_items) {
    if (item.variant_id && item.variant) {
      await supabase
        .from("product_variants")
        .update({ stock: item.variant.stock + item.quantity })
        .eq("id", item.variant_id);
    } else {
      await supabase
        .from("products")
        .update({ stock: item.product.stock + item.quantity })
        .eq("id", item.product_id);
    }
  }

  // Update order status
  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (updateError) throw new Error("Erro ao cancelar pedido");

  return updated;
}
