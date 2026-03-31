export type ProductVariantOption = {
  id: string;
  size?: string | null;
  sku?: string | null;
  priceDelta: number;
  stock?: number | null;
  isActive: boolean;
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
