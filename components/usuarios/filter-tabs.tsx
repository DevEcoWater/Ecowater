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

interface FilterTabsProps {
  onFilterChange?: (value: string) => void;
  defaultValue?: string;
  counts?: {
    total: number;
    activos: number;
    inactivos: number;
  };
}

export function FilterTabs({
  onFilterChange,
  defaultValue = "total",
  counts = { total: 0, activos: 0, inactivos: 0 },
}: FilterTabsProps) {
  const handleValueChange = (value: string) => {
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  return (
    <Tabs
      defaultValue={defaultValue}
      onValueChange={handleValueChange}
      className="w-fit"
    >
      <Select defaultValue={defaultValue} onValueChange={handleValueChange}>
        <SelectTrigger className="md:hidden flex w-[140px]" id="view-selector">
          <SelectValue placeholder="Seleccionar vista" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="total"
            className="flex items-center justify-between"
          >
            <span>Total</span>
            <Badge
              variant="secondary"
              className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {counts.total}
            </Badge>
          </SelectItem>
          <SelectItem
            value="activos"
            className="flex items-center justify-between"
          >
            <span>Activos</span>
            <Badge
              variant="secondary"
              className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {counts.activos}
            </Badge>
          </SelectItem>
          <SelectItem
            value="inactivos"
            className="flex items-center justify-between"
          >
            <span>Inactivos</span>
            <Badge
              variant="secondary"
              className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
            >
              {counts.inactivos}
            </Badge>
          </SelectItem>
        </SelectContent>
      </Select>
      <TabsList className="md:flex hidden">
        <TabsTrigger value="total" className="flex items-center gap-1">
          Total
          <Badge
            variant="secondary"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
          >
            {counts.total}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="activos" className="flex items-center gap-1">
          Activos
          <Badge
            variant="secondary"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
          >
            {counts.activos}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="inactivos" className="flex items-center gap-1">
          Inactivos
          <Badge
            variant="secondary"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/30"
          >
            {counts.inactivos}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
