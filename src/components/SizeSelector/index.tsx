"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  value: string | undefined;
  onChange: (value: string) => void;
  sizes: string[];
  label?: string;
  width?: number | string;
  className?: string;
};

export function SizeSelector({
  value,
  onChange,
  sizes,
  label = "TAM",
  width,
  className,
}: SizeSelectorProps) {
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
        onValueChange={onChange}
        className="flex items-center gap-1"
      >
        {sizes.map((s) => (
          <label
            key={s}
            className={cn(
              "cursor-pointer rounded-md border text-center text-[11px] font-medium leading-none",
              "px-0 py-2",
              "w-8",
              value === s
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent"
            )}
            title={s}
          >
            <RadioGroupItem value={s} className="sr-only" />
            {s}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
