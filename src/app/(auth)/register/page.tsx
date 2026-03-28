"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      options: { data: { name: formData.get("name") as string } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Conta criada com sucesso!");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10 pt-6 sm:pt-10">
      <div className="mb-6 text-center">
        <Link href="/" className="text-xl font-extrabold">
          MyCommerce
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">Crie sua conta</p>
      </div>

      <form className="space-y-4 rounded-xl border bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" required placeholder="Seu nome" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required placeholder="seu@email.com" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" name="password" type="password" required minLength={6} placeholder="Min. 6 caracteres" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Criar conta
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">Ja tem conta? </span>
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </div>
    </main>
  );
}
