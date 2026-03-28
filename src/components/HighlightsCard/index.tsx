"use client";

import * as React from "react";
import { ImageProps } from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CommerceImage } from "@/components/ui/commerce-image";

type HightlightCardProps = {
  title: string;
  href?: string;
  image: Pick<ImageProps, "src" | "alt">;
  subtitle?: string;
  eyebrow?: string;
  imgAspect?: "square" | "wide" | "portrait";
  className?: string;
};

export const HighlightCard = ({
  title,
  href,
  image,
  subtitle,
  eyebrow,
  imgAspect = "wide",
  className,
}: HightlightCardProps) => {
  const ClickableWrapper: React.FC<React.PropsWithChildren> = ({ children }) =>
    href ? (
      <Link
        href={href}
        aria-label={title}
        className="block h-full focus:outline-none"
      >
        {children}
      </Link>
    ) : (
      <div aria-label={title} className="block h-full focus:outline-none">
        {children}
      </div>
    );

  return (
    <Card
      className={cn(
        "h-full flex flex-col",
        "group overflow-hidden border-0 shadow-sm ring-1 ring-black/5 rounded-2xl bg-white",
        "transition hover:shadow-md hover:ring-black/10",
        className
      )}
    >
      <ClickableWrapper>
        <CardContent className="p-3 grid h-full grid-rows-[auto,1fr] gap-3">
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-xl bg-primary/10",
                imgAspect === "square"
                  ? "aspect-square"
                  : imgAspect === "portrait"
                ? "aspect-3/4"
                : "aspect-16/10"
            )}
          >
            <CommerceImage
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 80vw, 33vw"
              className="object-contain transition-transform duration-300 group-hover:scale-[1.03]"
              priority={false}
            />
          </div>

          <CardHeader className="px-0 pb-0 pt-0 flex flex-col gap-1">
            {eyebrow ? (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium tracking-wide text-neutral-700">
                {eyebrow}
              </span>
            ) : null}

            <CardTitle className="text-base leading-5 line-clamp-2">
              {title}
            </CardTitle>

            {subtitle ? (
              <p className="text-sm text-neutral-600 line-clamp-1">
                {subtitle}
              </p>
            ) : null}
          </CardHeader>
        </CardContent>
      </ClickableWrapper>
    </Card>
  );
};
