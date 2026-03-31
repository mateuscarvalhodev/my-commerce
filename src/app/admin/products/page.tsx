"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currency } from "@/lib/utils";
import {
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  saveProductVariants,
  getProductVariants,
} from "@/actions/admin";
import { getCategories } from "@/actions/products";
import { toast } from "sonner";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  category_id: string | null;
  created_at: string;
}

const CLOTHING_SIZES = ["P", "M", "G", "GG"] as const;

type SizeStock = Record<string, number>;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Stock / variants state
  const [sizeMode, setSizeMode] = useState<"none" | "sized">("none");
  const [plainStock, setPlainStock] = useState("0");
  const [sizeStock, setSizeStock] = useState<SizeStock>(
    Object.fromEntries(CLOTHING_SIZES.map((s) => [s, 0]))
  );

  useEffect(() => {
    loadProducts();
    getCategories().then(setCategories).catch(console.error);
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await getAdminProducts();
      setProducts(result.data as AdminProduct[]);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setName("");
    setSlug("");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setCategoryId("");
    setIsActive(true);
    setSizeMode("none");
    setPlainStock("0");
    setSizeStock(Object.fromEntries(CLOTHING_SIZES.map((s) => [s, 0])));
    setEditing(null);
    setShowForm(false);
  }

  function formatBRL(value: string) {
    const digits = value.replace(/\D/g, "");
    const cents = Number(digits) / 100;
    return cents.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function parseBRL(formatted: string): number {
    const digits = formatted.replace(/\D/g, "");
    return Number(digits) / 100;
  }

  async function openEdit(product: AdminProduct) {
    setEditing(product);
    setName(product.name);
    setSlug(product.slug);
    setDescription(product.description ?? "");
    setPrice(formatBRL(String(product.price * 100)));
    setImageUrl(product.image_url ?? "");
    setCategoryId(product.category_id ?? "");
    setIsActive(product.is_active);

    // Load existing variants to determine size mode
    try {
      const variants = await getProductVariants(product.id);
      const sizeVariants = variants.filter(
        (v: { size?: string | null }) => v.size
      );
      if (sizeVariants.length > 0) {
        setSizeMode("sized");
        const stockMap: SizeStock = Object.fromEntries(
          CLOTHING_SIZES.map((s) => [s, 0])
        );
        for (const v of sizeVariants) {
          if (v.size && v.size in stockMap) {
            stockMap[v.size] = v.stock ?? 0;
          }
        }
        setSizeStock(stockMap);
        setPlainStock("0");
      } else {
        setSizeMode("none");
        setPlainStock(String(product.stock));
        setSizeStock(Object.fromEntries(CLOTHING_SIZES.map((s) => [s, 0])));
      }
    } catch {
      setSizeMode("none");
      setPlainStock(String(product.stock));
    }

    setShowForm(true);
  }

  function generateSlug(text: string) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function computeTotalStock(): number {
    if (sizeMode === "none") return Number(plainStock) || 0;
    return Object.values(sizeStock).reduce((sum, v) => sum + v, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    const numericPrice = parseBRL(price);
    if (numericPrice <= 0) {
      toast.error("Informe um preço válido.");
      return;
    }

    const totalStock = computeTotalStock();
    if (sizeMode === "none" && totalStock < 0) {
      toast.error("Informe o estoque.");
      return;
    }

    try {
      const finalSlug = slug || generateSlug(name);
      let productId: string;

      if (editing) {
        await updateProduct(editing.id, {
          name,
          slug: finalSlug,
          description,
          price: numericPrice,
          stock: totalStock,
          image_url: imageUrl || undefined,
          category_id: categoryId || undefined,
          is_active: isActive,
        });
        productId = editing.id;
      } else {
        const product = await createProduct({
          name,
          slug: finalSlug,
          description,
          price: numericPrice,
          stock: totalStock,
          image_url: imageUrl,
          category_id: categoryId,
          is_active: isActive,
        });
        productId = product.id;
      }

      // Save variants
      if (sizeMode === "sized") {
        const variants = CLOTHING_SIZES.map((s) => ({
          size: s,
          stock: sizeStock[s] ?? 0,
        }));
        await saveProductVariants(productId, variants);
      } else {
        // Remove size variants if switching to "sem tamanho"
        await saveProductVariants(productId, []);
      }

      toast.success(editing ? "Produto atualizado!" : "Produto criado!");
      resetForm();
      await loadProducts();
    } catch (err) {
      console.error("Failed to save product", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("SLUG_DUPLICADO") || msg.includes("products_slug_key")) {
        toast.error("Já existe um produto com esse nome/slug. Altere o nome ou o slug.");
      } else {
        toast.error("Erro ao salvar produto.");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (err) {
      console.error("Failed to delete product", err);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Produtos</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="mb-6 rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {editing ? "Editar Produto" : "Novo Produto"}
            </h3>
            <button onClick={resetForm}>
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing) setSlug(generateSlug(e.target.value));
                }}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="price">Preço *</Label>
              <Input
                id="price"
                value={price}
                onChange={(e) => setPrice(formatBRL(e.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div>
              <Label htmlFor="category_id">Categoria *</Label>
              <select
                id="category_id"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="image_url">URL da Imagem</Label>
              <Input
                id="image_url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              <Label htmlFor="is_active">Ativo</Label>
            </div>

            {/* ─── Stock / Size variants ──────────────────────────── */}
            <div className="sm:col-span-2 space-y-3 rounded-lg border p-4">
              <Label className="text-base font-semibold">Estoque</Label>

              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeMode"
                    checked={sizeMode === "none"}
                    onChange={() => setSizeMode("none")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Sem tamanho</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeMode"
                    checked={sizeMode === "sized"}
                    onChange={() => setSizeMode("sized")}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Com tamanhos (P / M / G / GG)</span>
                </label>
              </div>

              {sizeMode === "none" ? (
                <div className="max-w-50">
                  <Label htmlFor="plainStock">Quantidade *</Label>
                  <Input
                    id="plainStock"
                    type="number"
                    min="0"
                    value={plainStock}
                    onChange={(e) => setPlainStock(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {CLOTHING_SIZES.map((s) => (
                    <div key={s}>
                      <Label htmlFor={`stock-${s}`}>{s}</Label>
                      <Input
                        id={`stock-${s}`}
                        type="number"
                        min="0"
                        value={sizeStock[s]}
                        onChange={(e) =>
                          setSizeStock((prev) => ({
                            ...prev,
                            [s]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                      />
                    </div>
                  ))}
                  <div className="col-span-full text-xs text-muted-foreground">
                    Total: {Object.values(sizeStock).reduce((a, b) => a + b, 0)}{" "}
                    unidades
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:col-span-2">
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
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Preço</th>
                <th className="px-4 py-3 text-left font-medium">Estoque</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, i) => (
                <tr
                  key={product.id}
                  className={i % 2 === 0 ? "bg-card" : "bg-muted/30"}
                >
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">{currency(product.price)}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {product.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Nenhum produto encontrado.
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
