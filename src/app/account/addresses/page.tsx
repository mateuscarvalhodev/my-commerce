"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  getAddresses,
  createAddress,
  deleteAddress,
} from "@/actions/addresses";

interface AddressData {
  id: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default?: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    try {
      const data = await getAddresses();
      setAddresses(data as any);
    } catch {
      toast.error("Erro ao carregar enderecos");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setState("");
    setZipCode("");
    setShowForm(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newAddress = await createAddress({
        street,
        number,
        complement: complement || undefined,
        neighborhood,
        city,
        state,
        zip_code: zipCode,
      });
      setAddresses((prev) => [newAddress as any, ...prev]);
      resetForm();
      toast.success("Endereco adicionado com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao criar endereco"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(addressId: string) {
    if (!confirm("Tem certeza que deseja remover este endereco?")) return;

    setDeletingId(addressId);
    try {
      await deleteAddress(addressId);
      setAddresses((prev) => prev.filter((a) => a.id !== addressId));
      toast.success("Endereco removido");
    } catch (error) {
      toast.error("Erro ao remover endereco");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin opacity-60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Enderecos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie seus enderecos de entrega
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "outline" : "default"}
        >
          <Plus className="mr-1 size-4" />
          {showForm ? "Cancelar" : "Novo endereco"}
        </Button>
      </div>

      {/* Add form */}
      {showForm ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"
        >
          <h3 className="font-semibold">Novo endereco</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Rua, Avenida, etc."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="number">Numero</Label>
              <Input
                id="number"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Apto 101"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Sao Paulo"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="00000-000"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Salvar endereco
            </Button>
          </div>
        </form>
      ) : null}

      {/* Addresses list */}
      {addresses.length === 0 && !showForm ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <MapPin className="size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Nenhum endereco cadastrado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex items-start justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {addr.street}, {addr.number}
                    {addr.complement ? ` - ${addr.complement}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {addr.neighborhood} - {addr.city}/{addr.state}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CEP: {addr.zip_code}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={deletingId === addr.id}
                onClick={() => handleDelete(addr.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                {deletingId === addr.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
