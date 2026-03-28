"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currency } from "@/lib/utils";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/actions/admin";

interface AdminCoupon {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    try {
      const data = await getAdminCoupons();
      setCoupons(data as AdminCoupon[]);
    } catch (err) {
      console.error("Failed to load coupons", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setCode("");
    setType("percent");
    setValue("");
    setMinOrderValue("");
    setMaxUses("");
    setExpiresAt("");
    setIsActive(true);
    setEditing(null);
    setShowForm(false);
  }

  function openEdit(coupon: AdminCoupon) {
    setEditing(coupon);
    setCode(coupon.code);
    setType(coupon.type);
    setValue(String(coupon.value));
    setMinOrderValue(coupon.min_order_value ? String(coupon.min_order_value) : "");
    setMaxUses(coupon.max_uses ? String(coupon.max_uses) : "");
    setExpiresAt(coupon.expires_at ? coupon.expires_at.slice(0, 10) : "");
    setIsActive(coupon.is_active);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        code,
        type,
        value: Number(value),
        min_order_value: minOrderValue ? Number(minOrderValue) : undefined,
        max_uses: maxUses ? Number(maxUses) : undefined,
        expires_at: expiresAt || undefined,
        is_active: isActive,
      };

      if (editing) {
        await updateCoupon(editing.id, payload);
      } else {
        await createCoupon(payload);
      }
      resetForm();
      await loadCoupons();
    } catch (err) {
      console.error("Failed to save coupon", err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      await deleteCoupon(id);
      await loadCoupons();
    } catch (err) {
      console.error("Failed to delete coupon", err);
    }
  }

  function formatDiscount(coupon: AdminCoupon) {
    if (coupon.type === "percent") {
      return `${coupon.value}%`;
    }
    return currency(coupon.value);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cupons</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cupom
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editing ? "Editar Cupom" : "Novo Cupom"}
            </h3>
            <button onClick={resetForm}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label htmlFor="code">Codigo</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="EX: DESCONTO10"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "percent" | "fixed")
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="percent">Porcentagem</option>
                <option value="fixed">Valor Fixo</option>
              </select>
            </div>
            <div>
              <Label htmlFor="value">Valor do Desconto</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="min_order_value">Pedido Minimo</Label>
              <Input
                id="min_order_value"
                type="number"
                step="0.01"
                min="0"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="max_uses">Usos Maximos</Label>
              <Input
                id="max_uses"
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expires_at">Expira em</Label>
              <Input
                id="expires_at"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="coupon_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor="coupon_active">Ativo</Label>
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
              <Button type="submit">
                {editing ? "Salvar" : "Criar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Codigo</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Usos</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Expira</th>
                <th className="px-4 py-3 text-left font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon, i) => {
                const expired =
                  coupon.expires_at && new Date(coupon.expires_at) < new Date();
                return (
                  <tr
                    key={coupon.id}
                    className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.type === "percent" ? "Porcentagem" : "Fixo"}
                    </td>
                    <td className="px-4 py-3">{formatDiscount(coupon)}</td>
                    <td className="px-4 py-3">
                      {coupon.used_count}
                      {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          expired
                            ? "bg-red-100 text-red-700"
                            : coupon.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {expired
                          ? "Expirado"
                          : coupon.is_active
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coupon.expires_at
                        ? new Date(coupon.expires_at).toLocaleDateString("pt-BR")
                        : "---"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(coupon)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {coupons.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
