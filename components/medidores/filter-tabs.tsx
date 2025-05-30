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
import { MeterStatusCounts } from "@/types/meters/meter-types";

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

  const valuesToMap = [
    { value: "total", label: "Total", count: total },
    { value: "activo", label: "Activos", count: counts.actives },
    { value: "inactivo", label: "Inactivos", count: counts.inactives },
    {
      value: "mantenimiento",
      label: "Mantenimiento",
      count: counts.maintenances,
    },
    { value: "fallido", label: "Fallidos", count: counts.faultys },
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
