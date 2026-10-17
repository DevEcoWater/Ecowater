"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CardColor = "blue" | "green" | "slate" | "amber" | "red";

const COLOR_CLASSES: Record<CardColor, { accent: string; icon: string; ring: string }> = {
  blue: { accent: "border-l-blue-500", icon: "text-blue-500", ring: "ring-blue-500" },
  green: { accent: "border-l-green-500", icon: "text-green-500", ring: "ring-green-500" },
  slate: { accent: "border-l-slate-400", icon: "text-slate-400", ring: "ring-slate-400" },
  amber: { accent: "border-l-amber-500", icon: "text-amber-500", ring: "ring-amber-500" },
  red: { accent: "border-l-red-500", icon: "text-red-500", ring: "ring-red-500" },
};

export interface StatusFilterCardOption {
  value: string;
  label: string;
  Icon: React.ElementType;
  color: CardColor;
  count?: number | null;
}

interface StatusFilterCardsProps {
  options: StatusFilterCardOption[];
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

/** Tarjetas de conteo por estado que a la vez funcionan como filtro de la tabla. */
export function StatusFilterCards({ options, value, onChange, isLoading }: StatusFilterCardsProps) {
  return (
    <div role="tablist" aria-label="Filtrar por estado" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {options.map(({ value: optionValue, label, Icon, color, count }) => {
        const selected = value === optionValue;
        const c = COLOR_CLASSES[color];

        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              "bg-card rounded-lg border border-l-4 p-4 flex flex-col gap-2 text-left transition-all",
              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              c.accent,
              selected ? cn("ring-2 ring-offset-2 ring-offset-background", c.ring) : "opacity-80 hover:opacity-100"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {label}
              </span>
              <Icon className={cn("h-4 w-4", c.icon)} />
            </div>
            {isLoading && count == null ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">{count ?? 0}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
