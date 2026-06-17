"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { X } from "lucide-react";
import { DataTable } from "../ui/data-table";
import { meterColumns } from "./columns";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { MeterCard } from "./meter-card";
import { Skeleton } from "@/components/ui/skeleton";

interface MeterTableProps {
  data: MeterDataForTable[];
  isLoading?: boolean;
  error?: Error | null;
}

export const MeterTable = ({ data, isLoading, error }: MeterTableProps) => {
  const router = useRouter();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data || [],
    columns: meterColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleRowClick = (meter: MeterDataForTable) => {
    router.push(`/dashboard/medidores/${(meter as any).id}`);
  };

  return (
    <>
      {/* Desktop table — hidden on mobile */}
      <div className="hidden lg:block">
        <DataTable
          columns={meterColumns}
          data={data || []}
          table={table}
          isLoading={isLoading ?? false}
          error={error}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Mobile card list — hidden on desktop */}
      <div className="lg:hidden">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
            <X className="h-8 w-8" />
            <p>Ha ocurrido un error</p>
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map((meter) => (
              <MeterCard
                key={(meter as any).id}
                meter={meter}
                onClick={() => handleRowClick(meter)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-6">
            <X className="h-8 w-8" />
            <p>No se encontraron resultados</p>
          </div>
        )}
      </div>
    </>
  );
};
