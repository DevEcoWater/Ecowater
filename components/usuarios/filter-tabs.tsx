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
import { TCounts } from "@/types/users/user-types";
import { useRef, useEffect, useState } from "react";

interface FilterTabsProps {
  onFilterChange?: (value: string) => void;
  defaultValue?: string;
  total: number;
  counts: TCounts;
}

export function FilterTabs({
  onFilterChange,
  defaultValue = "total",
  total,
  counts = { actives: 0, inactives: 0, pendings: 0, blockeds: 0 },
}: FilterTabsProps) {
  const handleValueChange = (value: string) => {
    onFilterChange?.(value);
  };

  // 🔒 Guardar los valores iniciales solo una vez
  const [staticCounts, setStaticCounts] = useState<TCounts>(counts);
  const [staticTotal, setStaticTotal] = useState<number>(total);
  const initialized = useRef(false);

  useEffect(() => {
    // Solo guardar una vez cuando haya datos reales (no todos 0)
    const hasRealData =
      (counts.actives ||
        counts.inactives ||
        counts.pendings ||
        counts.blockeds) &&
      total > 0;

    if (hasRealData && !initialized.current) {
      setStaticCounts(counts);
      setStaticTotal(total);
      initialized.current = true;
    }
  }, [counts, total]);

  const valuesToMap = [
    { value: "total", label: "Total", count: staticTotal },
    { value: "activo", label: "Activos", count: staticCounts.actives },
    { value: "inactivo", label: "Inactivos", count: staticCounts.inactives },
    { value: "pendiente", label: "Pendiente", count: staticCounts.pendings },
    { value: "bloqueado", label: "Bloqueados", count: staticCounts.blockeds },
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
