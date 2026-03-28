"use client";

import { useEffect, useState } from "react";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "@/actions/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type Address = {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
};

type AddressForm = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
};

const emptyForm: AddressForm = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  country: "BR",
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const data = await getAddresses();
      setAddresses(data as Address[]);
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      street: addr.street ?? "",
      number: addr.number ?? "",
      complement: addr.complement ?? "",
      neighborhood: addr.neighborhood ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip_code: addr.zip_code ?? "",
      country: addr.country ?? "BR",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, form);
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingId ? (updated as Address) : a))
        );
        toast.success("Endereço atualizado!");
      } else {
        const created = await createAddress(form);
        setAddresses((prev) => [created as Address, ...prev]);
        toast.success("Endereço adicionado!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar endereço");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Endereço removido!");
    } catch {
      toast.error("Erro ao remover endereço");
    } finally {
      setDeletingId(null);
    }
  }

  function updateField(field: keyof AddressForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Endereços</h1>
        <Button size="sm" onClick={openNew}>
          <Plus className="mr-1 size-4" />
          Novo endereço
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum endereço cadastrado.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex gap-3 rounded-lg border p-4"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 space-y-1 text-sm">
                <p className="font-medium">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` - ${addr.complement}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {addr.neighborhood} - {addr.city}/{addr.state}
                </p>
                <p className="text-muted-foreground">CEP: {addr.zip_code}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => openEdit(addr)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => void handleDelete(addr.id)}
                  className="rounded p-1 text-muted-foreground hover:text-red-600"
                  disabled={deletingId === addr.id}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar endereço" : "Novo endereço"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-1">
                <Label>Rua</Label>
                <Input
                  value={form.street}
                  onChange={(e) => updateField("street", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Número</Label>
                <Input
                  value={form.number}
                  onChange={(e) => updateField("number", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Complemento</Label>
              <Input
                value={form.complement}
                onChange={(e) => updateField("complement", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Bairro</Label>
              <Input
                value={form.neighborhood}
                onChange={(e) => updateField("neighborhood", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Input
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  maxLength={2}
                  placeholder="SP"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>CEP</Label>
              <Input
                value={form.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
                placeholder="00000-000"
              />
            </div>

            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
