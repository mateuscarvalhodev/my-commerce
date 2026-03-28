"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderTree, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  parent_id?: string | null;
};

type CategoryForm = {
  name: string;
  description: string;
  parent_id: string;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  parent_id: "",
};

export default function AdminCategoriesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories((data ?? []) as Category[]);
    } catch {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      parent_id: category.parent_id ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Preencha o nome da categoria");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const slug = form.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload: Record<string, unknown> = {
        name: form.name,
        slug,
        description: form.description || null,
        parent_id: form.parent_id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("categories")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
        toast.success("Categoria criada");
      }
      setDialogOpen(false);
      await loadCategories();
    } catch {
      toast.error("Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", categoryId);
      if (error) throw error;
      toast.success("Categoria excluida");
      await loadCategories();
    } catch {
      toast.error("Erro ao excluir categoria");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderTree className="size-5" />
          <h1 className="text-2xl font-bold">Categorias</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          Nova categoria
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma categoria cadastrada.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Descricao</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {category.description ?? "--"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {category.slug ?? "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar categoria" : "Nova categoria"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Nome da categoria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Descricao</Label>
              <textarea
                id="category-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Descricao opcional"
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-parent">ID da categoria pai</Label>
              <Input
                id="category-parent"
                value={form.parent_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parent_id: e.target.value }))
                }
                placeholder="Opcional"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
