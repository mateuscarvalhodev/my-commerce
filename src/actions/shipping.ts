"use server";

import { calculateShipping, type ShippingQuoteResult } from "@/lib/shipping";

export async function getShippingOptions(zipCode: string): Promise<ShippingQuoteResult> {
  return calculateShipping({
    origin_cep: process.env.STORE_CEP || "01001000",
    destination_cep: zipCode,
    weight_kg: 1,
    length_cm: 20,
    width_cm: 15,
    height_cm: 10,
    order_value: 0,
  });
}
