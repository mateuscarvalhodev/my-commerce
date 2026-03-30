"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProductColors,
  createProductColor,
  updateProductColor,
  deleteProductColor,
  addColorImage,
  deleteColorImage,
  createColorVariant,
  updateColorVariant,
  deleteColorVariant,
  uploadColorImages,
} from "@/actions/product-colors";

type ColorImage = {
  id: string;
  url: string;
  position: number;
};

type ColorVariant = {
  id: string;
  size: string;
  sku: string;
  stock: number;
  price_delta: number;
  is_active: boolean;
};

type ProductColor = {
  id: string;
  product_id: string;
  name: string;
  hex: string;
  position: number;
  images: ColorImage[];
  variants: ColorVariant[];
};

type Props = {
  productId: string;
};

export function ProductColorsEditor({ productId }: Props) {
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set());

  // New color form
  const [showNewColor, setShowNewColor] = useState(false);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");

  const loadColors = useCallback(async () => {
    try {
      const data = await getProductColors(productId);
      setColors(data as ProductColor[]);
    } catch (err) {
      console.error("Erro ao carregar cores", err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadColors();
  }, [loadColors]);

  function toggleExpanded(colorId: string) {
    setExpandedColors((prev) => {
      const next = new Set(prev);
      if (next.has(colorId)) next.delete(colorId);
      else next.add(colorId);
      return next;
    });
  }

  async function handleCreateColor(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createProductColor({
        product_id: productId,
        name: newColorName,
        hex: newColorHex,
        position: colors.length,
      });
      setNewColorName("");
      setNewColorHex("#000000");
      setShowNewColor(false);
      await loadColors();
    } catch (err) {
      console.error("Erro ao criar cor", err);
    }
  }

  async function handleDeleteColor(colorId: string) {
    if (!confirm("Excluir esta cor e todas as suas imagens e variantes?")) return;
    try {
      await deleteProductColor(colorId);
      await loadColors();
    } catch (err) {
      console.error("Erro ao excluir cor", err);
    }
  }

  async function handleUpdateColor(
    colorId: string,
    data: Partial<{ name: string; hex: string }>
  ) {
    try {
      await updateProductColor(colorId, data);
      await loadColors();
    } catch (err) {
      console.error("Erro ao atualizar cor", err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Cores do Produto</h4>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowNewColor(!showNewColor)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Adicionar Cor
        </Button>
      </div>

      {showNewColor && (
        <form
          onSubmit={handleCreateColor}
          className="flex items-end gap-3 rounded border p-3"
        >
          <div className="flex-1">
            <Label htmlFor="new-color-name">Nome da Cor</Label>
            <Input
              id="new-color-name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Azul Marinho"
              required
            />
          </div>
          <div className="w-32">
            <Label htmlFor="new-color-hex">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="new-color-hex"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border"
              />
              <Input
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
          <Button type="submit" size="sm">
            Criar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowNewColor(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando cores...</p>
      ) : colors.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma cor adicionada. Produto funciona como produto simples.
        </p>
      ) : (
        <div className="space-y-2">
          {colors.map((color) => (
            <ColorCard
              key={color.id}
              color={color}
              productId={productId}
              isExpanded={expandedColors.has(color.id)}
              onToggle={() => toggleExpanded(color.id)}
              onDelete={() => handleDeleteColor(color.id)}
              onUpdate={(data) => handleUpdateColor(color.id, data)}
              onReload={loadColors}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Color Card ──────────────────────────────────────────────────────────────

function ColorCard({
  color,
  productId,
  isExpanded,
  onToggle,
  onDelete,
  onUpdate,
  onReload,
}: {
  color: ProductColor;
  productId: string;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (data: Partial<{ name: string; hex: string }>) => void;
  onReload: () => Promise<void>;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(color.name);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button type="button" onClick={onToggle} className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div
          className="h-6 w-6 shrink-0 rounded-full border"
          style={{ backgroundColor: color.hex }}
        />

        {editingName ? (
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onUpdate({ name: nameValue });
              setEditingName(false);
            }}
          >
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="h-7 w-40 text-sm"
              autoFocus
            />
            <Button type="submit" size="sm" variant="ghost" className="h-7 px-2 text-xs">
              OK
            </Button>
          </form>
        ) : (
          <button
            type="button"
            className="text-sm font-medium hover:underline"
            onClick={() => setEditingName(true)}
          >
            {color.name}
          </button>
        )}

        <span className="text-xs text-muted-foreground">{color.hex}</span>

        <span className="text-xs text-muted-foreground">
          {color.images.length} foto(s) · {color.variants.length} tamanho(s)
        </span>

        <div className="ml-auto">
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 border-t px-4 py-4">
          <ColorImagesSection
            color={color}
            productId={productId}
            onReload={onReload}
          />
          <ColorVariantsSection color={color} onReload={onReload} />
        </div>
      )}
    </div>
  );
}

// ─── Color Images Section ────────────────────────────────────────────────────

function ColorImagesSection({
  color,
  productId,
  onReload,
}: {
  color: ProductColor;
  productId: string;
  onReload: () => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) {
        formData.append("files", file);
      }
      await uploadColorImages(productId, color.id, formData);
      await onReload();
    } catch (err) {
      console.error("Erro no upload", err);
      alert(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    try {
      await addColorImage({
        product_color_id: color.id,
        url: imageUrl.trim(),
        position: color.images.length,
      });
      setImageUrl("");
      await onReload();
    } catch (err) {
      console.error("Erro ao adicionar imagem", err);
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await deleteColorImage(imageId);
      await onReload();
    } catch (err) {
      console.error("Erro ao excluir imagem", err);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Fotos
      </p>

      {color.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {color.images
            .sort((a, b) => a.position - b.position)
            .map((img) => (
              <div key={img.id} className="group relative">
                <img
                  src={img.url}
                  alt=""
                  className="h-20 w-20 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <span className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Upload className="h-3 w-3" />
            {uploading ? "Enviando..." : "Upload"}
          </span>
        </label>

        <form onSubmit={handleAddUrl} className="flex items-center gap-1">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="ou cole uma URL"
            className="h-8 w-52 text-xs"
          />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-xs"
          >
            +
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── Color Variants Section ──────────────────────────────────────────────────

function ColorVariantsSection({
  color,
  onReload,
}: {
  color: ProductColor;
  onReload: () => Promise<void>;
}) {
  const [showNew, setShowNew] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newPriceDelta, setNewPriceDelta] = useState("0");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createColorVariant({
        product_color_id: color.id,
        size: newSize,
        sku: newSku,
        stock: Number(newStock),
        price_delta: Number(newPriceDelta),
      });
      setNewSize("");
      setNewSku("");
      setNewStock("0");
      setNewPriceDelta("0");
      setShowNew(false);
      await onReload();
    } catch (err) {
      console.error("Erro ao criar variante", err);
    }
  }

  async function handleUpdateVariant(
    variantId: string,
    data: Partial<{ stock: number; price_delta: number; is_active: boolean }>
  ) {
    try {
      await updateColorVariant(variantId, data);
      await onReload();
    } catch (err) {
      console.error("Erro ao atualizar variante", err);
    }
  }

  async function handleDeleteVariant(variantId: string) {
    try {
      await deleteColorVariant(variantId);
      await onReload();
    } catch (err) {
      console.error("Erro ao excluir variante", err);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Tamanhos / Variantes
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setShowNew(!showNew)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Tamanho
        </Button>
      </div>

      {showNew && (
        <form
          onSubmit={handleCreate}
          className="grid grid-cols-5 items-end gap-2 rounded border p-2"
        >
          <div>
            <Label className="text-xs">Tamanho</Label>
            <Input
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder="P, M, G..."
              className="h-8 text-xs"
              required
            />
          </div>
          <div>
            <Label className="text-xs">SKU</Label>
            <Input
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs">Estoque</Label>
            <Input
              type="number"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="h-8 text-xs"
              min="0"
            />
          </div>
          <div>
            <Label className="text-xs">Delta Preço</Label>
            <Input
              type="number"
              step="0.01"
              value={newPriceDelta}
              onChange={(e) => setNewPriceDelta(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex gap-1">
            <Button type="submit" size="sm" className="h-8 text-xs">
              Criar
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setShowNew(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </form>
      )}

      {color.variants.length > 0 ? (
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Tamanho</th>
                <th className="px-3 py-2 text-left font-medium">SKU</th>
                <th className="px-3 py-2 text-left font-medium">Estoque</th>
                <th className="px-3 py-2 text-left font-medium">Delta Preço</th>
                <th className="px-3 py-2 text-left font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {color.variants.map((v) => (
                <VariantRow
                  key={v.id}
                  variant={v}
                  onUpdate={(data) => handleUpdateVariant(v.id, data)}
                  onDelete={() => handleDeleteVariant(v.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhum tamanho adicionado.</p>
      )}
    </div>
  );
}

function VariantRow({
  variant,
  onUpdate,
  onDelete,
}: {
  variant: ColorVariant;
  onUpdate: (data: Partial<{ stock: number; price_delta: number }>) => void;
  onDelete: () => void;
}) {
  const [stock, setStock] = useState(String(variant.stock));
  const [priceDelta, setPriceDelta] = useState(String(variant.price_delta));

  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-2 font-medium">{variant.size}</td>
      <td className="px-3 py-2 text-muted-foreground">{variant.sku || "—"}</td>
      <td className="px-3 py-2">
        <Input
          type="number"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          onBlur={() => {
            const n = Number(stock);
            if (n !== variant.stock) onUpdate({ stock: n });
          }}
          className="h-7 w-20 text-xs"
          min="0"
        />
      </td>
      <td className="px-3 py-2">
        <Input
          type="number"
          step="0.01"
          value={priceDelta}
          onChange={(e) => setPriceDelta(e.target.value)}
          onBlur={() => {
            const n = Number(priceDelta);
            if (n !== variant.price_delta) onUpdate({ price_delta: n });
          }}
          className="h-7 w-24 text-xs"
        />
      </td>
      <td className="px-3 py-2">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3 w-3 text-red-500" />
        </Button>
      </td>
    </tr>
  );
}
