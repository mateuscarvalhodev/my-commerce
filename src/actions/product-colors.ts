"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nao autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Acesso negado");

  return { supabase, user };
}

// ─── Colors ──────────────────────────────────────────────────────────────────

export async function getProductColors(productId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("product_colors")
    .select("*, images:product_images(*), variants:product_variants(*)")
    .eq("product_id", productId)
    .order("position");

  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function createProductColor(data: {
  product_id: string;
  name: string;
  hex: string;
  position?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: color, error } = await admin
    .from("product_colors")
    .insert({
      product_id: data.product_id,
      name: data.name,
      hex: data.hex,
      position: data.position ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return color;
}

export async function updateProductColor(
  id: string,
  data: Partial<{ name: string; hex: string; position: number }>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: color, error } = await admin
    .from("product_colors")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return color;
}

export async function deleteProductColor(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Delete images from storage first
  const { data: images } = await admin
    .from("product_images")
    .select("url")
    .eq("product_color_id", id);

  // Delete color (cascades images + variants in DB)
  const { error } = await admin
    .from("product_colors")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Clean up storage if there were images
  if (images && images.length > 0) {
    const paths = images
      .map((img) => {
        const match = img.url?.match(/product-images\/(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await admin.storage.from("product-images").remove(paths);
    }
  }

  return { success: true };
}

// ─── Color Images ────────────────────────────────────────────────────────────

export async function addColorImage(data: {
  product_color_id: string;
  url: string;
  position?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: image, error } = await admin
    .from("product_images")
    .insert({
      product_color_id: data.product_color_id,
      url: data.url,
      position: data.position ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return image;
}

export async function deleteColorImage(imageId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Get image URL for storage cleanup
  const { data: image } = await admin
    .from("product_images")
    .select("url")
    .eq("id", imageId)
    .single();

  const { error } = await admin
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);

  // Clean up storage
  if (image?.url) {
    const match = image.url.match(/product-images\/(.+)/);
    if (match) {
      await admin.storage.from("product-images").remove([match[1]]);
    }
  }

  return { success: true };
}

// ─── Color Variants ──────────────────────────────────────────────────────────

export async function createColorVariant(data: {
  product_color_id: string;
  size: string;
  sku?: string;
  stock?: number;
  price_delta?: number;
  is_active?: boolean;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: variant, error } = await admin
    .from("product_variants")
    .insert({
      product_color_id: data.product_color_id,
      size: data.size,
      sku: data.sku ?? "",
      stock: data.stock ?? 0,
      price_delta: data.price_delta ?? 0,
      is_active: data.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return variant;
}

export async function updateColorVariant(
  id: string,
  data: Partial<{
    size: string;
    sku: string;
    stock: number;
    price_delta: number;
    is_active: boolean;
  }>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: variant, error } = await admin
    .from("product_variants")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return variant;
}

export async function deleteColorVariant(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("product_variants")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);

  return { success: true };
}

// ─── Image Upload ────────────────────────────────────────────────────────────

export async function uploadColorImages(
  productId: string,
  colorId: string,
  formData: FormData
) {
  await requireAdmin();
  const admin = createAdminClient();

  const files = formData.getAll("files") as File[];

  if (files.length === 0) throw new Error("Nenhum arquivo enviado");
  if (files.length > 10) throw new Error("Máximo 10 arquivos por upload");

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  const uploadedImages = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Formato não aceito: ${file.name}. Use JPEG, PNG ou WebP.`);
    }

    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande: ${file.name}. Máximo 5MB.`);
    }

    const ext = file.name.split(".").pop() ?? "webp";
    const fileName = `${Date.now()}-${i}.${ext}`;
    const storagePath = `${productId}/${colorId}/${fileName}`;

    const { error: uploadError } = await admin.storage
      .from("product-images")
      .upload(storagePath, file, { contentType: file.type });

    if (uploadError) {
      throw new Error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
    }

    const { data: publicUrlData } = admin.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const { data: image, error: insertError } = await admin
      .from("product_images")
      .insert({
        product_color_id: colorId,
        url: publicUrlData.publicUrl,
        position: i,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback storage upload
      await admin.storage.from("product-images").remove([storagePath]);
      throw new Error(`Erro ao salvar imagem: ${insertError.message}`);
    }

    uploadedImages.push(image);
  }

  return uploadedImages;
}
