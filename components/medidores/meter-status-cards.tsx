"use client";

import { Activity, AlertTriangle, Database, PowerOff, Wrench } from "lucide-react";
import { StatusFilterCards } from "@/components/ui/status-filter-cards";
import { MeterStatusCounts } from "@/types/meters/meter-types";

interface MeterStatusCardsProps {
  value: string;
  onChange: (value: string) => void;
  counts?: MeterStatusCounts;
  isLoading?: boolean;
}

export function MeterStatusCards({ value, onChange, counts, isLoading }: MeterStatusCardsProps) {
  return (
    <StatusFilterCards
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      options={[
        {
          value: "total",
          label: "Total",
          Icon: Database,
          color: "blue",
          count: counts && counts.actives + counts.inactives + counts.maintenances + counts.faultys,
        },
        { value: "ACTIVE", label: "Activos", Icon: Activity, color: "green", count: counts?.actives },
        { value: "INACTIVE", label: "Inactivos", Icon: PowerOff, color: "slate", count: counts?.inactives },
        { value: "MAINTENANCE", label: "Mantenimiento", Icon: Wrench, color: "amber", count: counts?.maintenances },
        { value: "FAULTY", label: "Fallidos", Icon: AlertTriangle, color: "red", count: counts?.faultys },
      ]}
    />
  );
}
