import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateShipping } from "@/lib/shipping";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destination_cep, items } = body;

    if (!destination_cep || !items?.length) {
      return NextResponse.json({ error: "CEP e itens sao obrigatorios" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let totalWeight = 0;
    let totalLength = 0;
    let totalWidth = 0;
    let totalHeight = 0;
    let orderValue = 0;

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("price, weight, width, height, length")
        .eq("id", item.product_id)
        .single();

      if (!product) continue;

      let unitPrice = Number(product.price);
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from("product_variants")
          .select("price_delta")
          .eq("id", item.variant_id)
          .single();
        if (variant?.price_delta) unitPrice += Number(variant.price_delta);
      }

      totalWeight += Number(product.weight ?? 0.3) * item.quantity;
      totalLength = Math.max(totalLength, Number(product.length ?? 16));
      totalWidth = Math.max(totalWidth, Number(product.width ?? 11));
      totalHeight += Number(product.height ?? 2) * item.quantity;
      orderValue += unitPrice * item.quantity;
    }

    const result = await calculateShipping({
      origin_cep: process.env.STORE_CEP || "01001000",
      destination_cep,
      weight_kg: totalWeight,
      length_cm: totalLength,
      width_cm: totalWidth,
      height_cm: Math.min(totalHeight, 100),
      order_value: orderValue,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular frete" },
      { status: 500 }
    );
  }
}
