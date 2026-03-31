/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

function isRemoteImageSource(src: ImageProps["src"]): src is string {
  return typeof src === "string" && /^https?:\/\//.test(src);
}

function isValidLocalSource(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return true; // StaticImport is always valid
  return src.startsWith("/") || src.startsWith(".");
}

export function CommerceImage(props: ImageProps) {
  if (!isRemoteImageSource(props.src) && isValidLocalSource(props.src)) {
    return <Image {...props} />;
  }

  if (!isRemoteImageSource(props.src)) {
    // Invalid src (not remote, not local path) — render fallback
    return <Image {...props} src="/product-placeholder.svg" />;
  }

  const {
    src,
    alt,
    className,
    fill,
    width,
    height,
    sizes,
    style,
    priority,
    loading,
  } = props;

  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full", className)}
        sizes={sizes}
        style={style}
        loading={priority ? "eager" : (loading ?? "lazy")}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={typeof width === "number" ? width : undefined}
      height={typeof height === "number" ? height : undefined}
      sizes={sizes}
      style={style}
      loading={priority ? "eager" : (loading ?? "lazy")}
    />
  );
}
