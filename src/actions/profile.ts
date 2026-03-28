"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Autenticacao necessaria");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw new Error(error.message);
  return { ...data, email: user.email };
}

export async function updateProfile(input: { full_name: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Autenticacao necessaria");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}
