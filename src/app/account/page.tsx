"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile();
        setEmail(profile.email ?? "");
        setName(profile.full_name ?? profile.name ?? "");
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ full_name: name });
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Minha conta</h1>

      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>

          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => void handleSignOut()}
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
