"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

type GenericCarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  loop?: boolean;
  autoplayMs?: number | false;
  itemClassName?: string;
  className?: string;
};

export function GenericCarousel<T>({
  items,
  renderItem,
  loop = true,
  autoplayMs = 3500,
  itemClassName = `
    basis-[85%]
    sm:basis-1/2
    md:basis-1/3
    lg:basis-1/4
    xl:basis-1/5
  `,
  className,
}: GenericCarouselProps<T>) {
  const plugins = React.useMemo(
    () =>
      autoplayMs
        ? [
            Autoplay({
              delay: autoplayMs,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            }),
          ]
        : [],
    [autoplayMs]
  );

  return (
    <Carousel
      className={className}
      opts={{ align: "start", containScroll: "trimSnaps", loop }}
      plugins={plugins}
    >
      <CarouselContent className="-ml-3">
        {items.map((item, idx) => (
          <CarouselItem key={idx} className={`pl-3 ${itemClassName}`}>
            {renderItem(item, idx)}
          </CarouselItem>
        ))}
      </CarouselContent>

      {/* <div className="mt-3 flex items-center justify-end gap-2">
        <CarouselPrevious className="relative left-0 size-9 rounded-full" />
        <CarouselNext className="relative right-0 size-9 rounded-full" />
      </div> */}
    </Carousel>
  );
}
