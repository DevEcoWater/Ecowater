import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UrgencyTabsProps {
  activeFilter: "all" | "alerts" | "errors";
  onFilterChange: (filter: "all" | "alerts" | "errors") => void;
  counts: {
    all: number;
    alerts: number;
    errors: number;
  };
}

export function UrgencyTabs({
  activeFilter,
  onFilterChange,
  counts,
}: UrgencyTabsProps) {
  const tabs = [
    { value: "all", label: "Todos", count: counts.all },
    { value: "alerts", label: "Alertas", count: counts.alerts },
    { value: "errors", label: "Errores", count: counts.errors },
  ] as const;

  return (
    <div className="flex space-x-1  p-1 rounded-lg">
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(tab.value)}
          className={cn(
            "text-xs px-3 py-1 h-auto flex-1",
            activeFilter === tab.value
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          )}>
          {tab.label} ({tab.count})
        </Button>
      ))}
    </div>
  );
}
