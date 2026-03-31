import type { CartLineItem, CatalogProduct, ProductVariantOption } from "./types";

export const PRODUCT_IMAGE_FALLBACK = "/product-placeholder.svg";
const DEFAULT_PIX_PERCENT = 10;
const DEFAULT_INSTALLMENTS = 10;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductSlug(name?: string | null, id?: string | number) {
  const slugFromName = name ? slugify(name) : "";
  if (slugFromName) {
    return slugFromName;
  }

  return `produto-${id ?? "sem-id"}`;
}

export function getCategorySlug(name?: string | null, id?: string | number) {
  const slugFromName = name ? slugify(name) : "";
  if (slugFromName) {
    return slugFromName;
  }

  return `categoria-${id ?? "sem-id"}`;
}

export function getSearchTermFromSlug(slug: string) {
  return slug.replace(/-/g, " ").trim();
}

export function resolveProductImage(imageUrl?: string | null) {
  return imageUrl && imageUrl.trim() ? imageUrl.trim() : PRODUCT_IMAGE_FALLBACK;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseProductToCatalogProduct(product: any): CatalogProduct {
  const productId = String(product.id ?? "sem-id");
  const title = product.name ?? `Produto ${productId}`;
  const price = Number(product.price) || 0;

  const allVariants: ProductVariantOption[] = (product.variants ?? product.product_variants ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((v: any) => ({
      id: String(v.id ?? ""),
      size: v.size ?? null,
      sku: v.sku ?? null,
      priceDelta: Number(v.price_delta) || 0,
      stock: v.stock != null ? Number(v.stock) : null,
      isActive: v.is_active !== false,
    }))
    .filter((v: ProductVariantOption) => v.id && v.isActive);

  const sizes = allVariants
    .map((v) => v.size)
    .filter((s): s is string => Boolean(s));

  // Build images: main image + product_images
  const images: string[] = [];
  const mainImage = product.image_url?.trim();
  if (mainImage) images.push(mainImage);

  const productImages = (product.images ?? product.product_images ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (Number(a.position) || 0) - (Number(b.position) || 0))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((img: any) => img.url?.trim())
    .filter((url: string | undefined): url is string => Boolean(url));

  for (const url of productImages) {
    if (!images.includes(url)) images.push(url);
  }

  return {
    id: productId,
    slug: getProductSlug(title, productId),
    title,
    description: product.description ?? null,
    price,
    installments: DEFAULT_INSTALLMENTS,
    pixPercent: DEFAULT_PIX_PERCENT,
    sizes: sizes.length > 0 ? sizes : [],
    images: images.length > 0 ? images : [PRODUCT_IMAGE_FALLBACK],
    stock: product.stock != null ? Number(product.stock) : null,
    isActive: product.is_active !== false,
    variants: allVariants,
  };
}

export function mergeCartLineItems(
  currentItems: CartLineItem[],
  incomingItems: CartLineItem[]
) {
  const mergedItems = [...currentItems];

  for (const incomingItem of incomingItems) {
    const existingItemIndex = mergedItems.findIndex(
      (item) =>
        String(item.id) === String(incomingItem.id) &&
        (item.size ?? "") === (incomingItem.size ?? "")
    );

    if (existingItemIndex >= 0) {
      mergedItems[existingItemIndex] = {
        ...mergedItems[existingItemIndex],
        qty: Math.max(mergedItems[existingItemIndex].qty, incomingItem.qty),
      };
      continue;
    }

    mergedItems.push(incomingItem);
  }

  return mergedItems;
}

export function areCartLineItemsEqual(
  leftItems: CartLineItem[],
  rightItems: CartLineItem[]
) {
  if (leftItems.length !== rightItems.length) {
    return false;
  }

  return leftItems.every((leftItem, index) => {
    const rightItem = rightItems[index];

    return (
      String(leftItem.id) === String(rightItem.id) &&
      leftItem.qty === rightItem.qty &&
      leftItem.price === rightItem.price &&
      (leftItem.size ?? "") === (rightItem.size ?? "")
    );
  });
}

export function calculateCartSubtotal(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.price * item.qty, 0);
}

export function calculateCartQuantity(items: CartLineItem[]) {
  return items.reduce((total, item) => total + item.qty, 0);
}
