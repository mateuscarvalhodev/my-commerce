"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateShipping } from "@/lib/shipping";

interface GuestCartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
}

interface GuestAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

export async function guestCheckout(data: {
  email: string;
  name?: string;
  items: GuestCartItem[];
  address: GuestAddress;
  paymentMethod: string;
  couponCode?: string;
  shippingServiceCode?: string;
  cpf?: string;
}) {
  if (!data.email) throw new Error("E-mail é obrigatório");
  if (!data.items.length) throw new Error("Carrinho vazio");

  const admin = createAdminClient();

  // 1. Find or create user silently
  let userId: string;

  // Check if user already exists
  const { data: existingProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .limit(1);

  if (existingProfiles && existingProfiles.length > 0) {
    userId = existingProfiles[0].id;
  } else {
    // Create user via admin API (bypasses email confirmation)
    const password = crypto.randomUUID(); // random password
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { name: data.name || "" },
    });

    if (authError) throw new Error(`Erro ao criar conta: ${authError.message}`);
    userId = authUser.user.id;
  }

  // 2. Create address for this user
  const { data: address, error: addrError } = await admin
    .from("addresses")
    .insert({
      user_id: userId,
      street: data.address.street,
      number: data.address.number,
      complement: data.address.complement || null,
      neighborhood: data.address.neighborhood,
      city: data.address.city,
      state: data.address.state,
      zip_code: data.address.zip_code,
    })
    .select()
    .single();

  if (addrError || !address) throw new Error("Erro ao salvar endereço");

  // 3. Validate stock and get product data
  const cartItems: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
    price: number;
    product: any;
    variant: any;
  }> = [];

  for (const item of data.items) {
    const { data: product } = await admin
      .from("products")
      .select("*")
      .eq("id", item.product_id)
      .single();

    if (!product) throw new Error(`Produto não encontrado: ${item.product_id}`);

    let variant = null;
    if (item.variant_id) {
      const { data: v } = await admin
        .from("product_variants")
        .select("*")
        .eq("id", item.variant_id)
        .single();
      variant = v;
    }

    const stock = variant ? variant.stock : product.stock;
    if (item.quantity > stock) {
      throw new Error(`Estoque insuficiente para "${product.name}"`);
    }

    cartItems.push({
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      product,
      variant,
    });
  }

  // 4. Calculate subtotal
  let subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.price),
    0
  );

  // 5. Apply coupon
  let discount = 0;
  if (data.couponCode) {
    const { data: coupon } = await admin
      .from("coupons")
      .select("*")
      .eq("code", data.couponCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (coupon) {
      const notExpired = !coupon.expires_at || new Date(coupon.expires_at) > new Date();
      const hasUses = !coupon.max_uses || coupon.uses_count < coupon.max_uses;
      const meetsMinimum = !coupon.min_order_value || subtotal >= Number(coupon.min_order_value);

      if (notExpired && hasUses && meetsMinimum) {
        discount = coupon.type === "percent"
          ? subtotal * (Number(coupon.value) / 100)
          : Number(coupon.value);

        await admin
          .from("coupons")
          .update({ uses_count: coupon.uses_count + 1 })
          .eq("id", coupon.id);
      }
    }
  }

  // 6. Calculate shipping
  const totalWeight = cartItems.reduce(
    (sum, item) => sum + (Number(item.product.weight) || 0.5) * item.quantity,
    0
  );

  const shippingResult = await calculateShipping({
    origin_cep: process.env.STORE_CEP || "01001000",
    destination_cep: data.address.zip_code,
    weight_kg: totalWeight,
    length_cm: 30,
    width_cm: 20,
    height_cm: 15,
    order_value: subtotal - discount,
  });

  const shippingOption = data.shippingServiceCode
    ? shippingResult.options.find((o) => o.service_code === data.shippingServiceCode) ?? shippingResult.options[0]
    : shippingResult.options[0];

  const shippingCost = shippingOption?.price ?? 0;
  const total = subtotal - discount + shippingCost;

  // 7. Create order (using admin client to bypass RLS)
  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      total,
      shipping_cost: shippingCost,
      shipping_service: shippingOption?.service_name ?? null,
      shipping_deadline_days: shippingOption?.deadline_days ?? null,
      status: "pending",
      payment_method: data.paymentMethod,
      shipping_address_id: address.id,
    })
    .select()
    .single();

  if (orderError || !order) throw new Error("Erro ao criar pedido");

  // 8. Create order items
  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id || null,
    quantity: item.quantity,
    unit_price: item.price,
  }));

  await admin.from("order_items").insert(orderItems);

  // 9. Decrement stock
  for (const item of cartItems) {
    if (item.variant_id && item.variant) {
      await admin
        .from("product_variants")
        .update({ stock: item.variant.stock - item.quantity })
        .eq("id", item.variant_id);
    } else {
      await admin
        .from("products")
        .update({ stock: item.product.stock - item.quantity })
        .eq("id", item.product_id);
    }
  }

  return { order, userId };
}
