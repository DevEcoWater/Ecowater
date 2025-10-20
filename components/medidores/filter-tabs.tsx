"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MeterStatusCounts } from "@/types/meters/meter-types";
import { useRef, useEffect, useState } from "react";

interface FilterTabsProps {
  onFilterChange?: (value: string) => void;
  defaultValue?: string;
  total: number;
  counts: MeterStatusCounts;
}

export function FilterTabs({
  onFilterChange,
  defaultValue = "total",
  total,
  counts = { actives: 0, inactives: 0, maintenances: 0, faultys: 0 },
}: FilterTabsProps) {
  const handleValueChange = (value: string) => {
    onFilterChange?.(value);
  };

  const [staticCounts, setStaticCounts] = useState<MeterStatusCounts>(counts);
  const [staticTotal, setStaticTotal] = useState<number>(total);
  const initialized = useRef(false);

  useEffect(() => {
    // Solo setear una vez cuando haya valores reales (no todos en 0)
    const hasRealData =
      (counts.actives ||
        counts.inactives ||
        counts.maintenances ||
        counts.faultys) &&
      total > 0;

    if (hasRealData && !initialized.current) {
      setStaticCounts(counts);
      setStaticTotal(total);
      initialized.current = true;
    }
  }, [counts, total]);

  const valuesToMap = [
    { value: "total", label: "Total", count: staticTotal },
    { value: "ACTIVE", label: "Activos", count: staticCounts.actives },
    { value: "INACTIVE", label: "Inactivos", count: staticCounts.inactives },
    {
      value: "MAINTENANCE",
      label: "Mantenimiento",
      count: staticCounts.maintenances,
    },
    { value: "FAULTY", label: "Fallidos", count: staticCounts.faultys },
  ];

  return (
    <Tabs
      value={defaultValue}
      onValueChange={handleValueChange}
      className="w-fit"
    >
      <Select value={defaultValue} onValueChange={handleValueChange}>
        <SelectTrigger className="md:hidden flex w-[140px]" id="view-selector">
          <SelectValue placeholder="Seleccionar vista" />
        </SelectTrigger>
        <SelectContent>
          {valuesToMap.map((value) => (
            <SelectItem
              key={value.value}
              value={value.value}
              className="flex items-center justify-between"
            >
              <span>{value.label}</span>
              <Badge
                variant="secondary"
                className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
              >
                {value.count}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TabsList className="md:flex hidden">
        {valuesToMap.map((value) => (
          <TabsTrigger
            key={value.value}
            value={value.value}
            className="flex items-center gap-1"
          >
            {value.label}
            <Badge
              variant="secondary"
              className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {value.count}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
