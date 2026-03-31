"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  sizes: string[];
  stockBySize?: Record<string, number>;
  label?: string;
  width?: number | string;
  className?: string;
};

export function SizeSelector({
  value,
  onChange,
  sizes,
  stockBySize,
  label = "TAM",
  width,
  className,
}: SizeSelectorProps) {
  function isOutOfStock(s: string) {
    if (!stockBySize) return false;
    return (stockBySize[s] ?? 0) <= 0;
  }

  return (
    <div
      className={cn("space-y-1", className)}
      style={width ? { width } : undefined}
    >
      <div className="text-xs font-medium">
        {label}: {value || "-"}
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => {
          if (!isOutOfStock(v)) onChange(v);
        }}
        className="flex items-center gap-1"
      >
        {sizes.map((s) => {
          const outOfStock = isOutOfStock(s);
          return (
            <label
              key={s}
              className={cn(
                "relative rounded-md border text-center text-[11px] font-medium leading-none",
                "px-0 py-2",
                "w-8",
                outOfStock
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer",
                value === s && !outOfStock
                  ? "border-primary bg-primary text-primary-foreground"
                  : !outOfStock && "hover:bg-accent"
              )}
              title={outOfStock ? `${s} — Esgotado` : s}
            >
              <RadioGroupItem value={s} className="sr-only" disabled={outOfStock} />
              {s}
              {outOfStock && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground"
                >
                  <span className="block h-px w-[130%] -rotate-45 bg-current" />
                </span>
              )}
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
