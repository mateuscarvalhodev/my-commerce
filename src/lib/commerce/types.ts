export type ProductVariantOption = {
  id: string;
  size?: string | null;
  color?: string | null;
  colorId?: string | null;
  sku?: string | null;
  priceDelta: number;
  stock?: number | null;
  isActive: boolean;
};

export type ProductColorOption = {
  id: string;
  name: string;
  hex: string;
  images: string[];
  variants: ProductVariantOption[];
};

export type CatalogProduct = {
  id: string | number;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  promoPercent?: number;
  installments?: number;
  pixPercent?: number;
  sizes?: string[];
  images: string[];
  stock?: number | null;
  isActive?: boolean;
  variants?: ProductVariantOption[];
  colors?: ProductColorOption[];
};

export type CommerceImageSource = {
  src: string;
  alt: string;
};

export type CartLineItem = {
  id: string | number;
  title: string;
  image: CommerceImageSource;
  price: number;
  originalPrice?: number | null;
  size?: string;
  variantId?: string;
  qty: number;
};
