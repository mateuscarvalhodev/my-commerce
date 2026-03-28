import { getProfile, updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getProfile();

  async function handleUpdateName(formData: FormData) {
    "use server";
    const full_name = formData.get("full_name") as string;
    await updateProfile({ full_name });
    redirect("/account");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas informacoes pessoais
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <User className="size-7 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold">
              {profile.full_name ?? profile.name ?? "Sem nome"}
            </p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <form action={handleUpdateName} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={profile.full_name ?? profile.name ?? ""}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input value={profile.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              O e-mail nao pode ser alterado
            </p>
          </div>

          <Button type="submit">Salvar alteracoes</Button>
        </form>
      </div>
    </div>
  );
}
