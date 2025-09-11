import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  currentPeriod: "7d" | "30d" | "90d" | "1y";
  onPeriodChange: (period: "7d" | "30d" | "90d" | "1y") => void;
}

export function PeriodSelector({
  currentPeriod,
  onPeriodChange,
}: PeriodSelectorProps) {
  const periods = [
    { value: "7d", label: "7 días" },
    { value: "30d", label: "30 días" },
    { value: "90d", label: "90 días" },
    { value: "1y", label: "1 año" },
  ] as const;

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {periods.map((period) => (
        <Button
          key={period.value}
          variant="ghost"
          size="sm"
          onClick={() => onPeriodChange(period.value)}
          className={cn(
            "text-xs px-3 py-1 h-auto",
            currentPeriod === period.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          )}>
          {period.label}
        </Button>
      ))}
    </div>
  );
}
