import { redirect } from "next/navigation";
import { createClient } from "./server";

/**
 * Get the authenticated user + profile. Returns null if not logged in.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

/**
 * Require authentication. Redirects to /login if not logged in.
 */
export async function requireAuth() {
  const result = await getUser();
  if (!result) redirect("/login");
  return result;
}

/**
 * Require admin role. Redirects to /login if not logged in, to / if not admin.
 */
export async function requireAdmin() {
  const result = await requireAuth();
  if (result.profile?.role !== "admin") redirect("/");
  return result;
}
