"use server";

import { createClient } from "@/lib/supabase/server";
import { simulatePixPayment } from "@/lib/abacatepay";

export async function simulatePayment(pixId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // Check admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Acesso negado");

  const id = String(pixId ?? "").trim();
  if (!id) throw new Error("ID da cobrança é obrigatório");

  console.log("[SimulatePayment] id:", id);
  const result = await simulatePixPayment(id);
  return result;
}
