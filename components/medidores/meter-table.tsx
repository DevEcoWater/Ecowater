"use client";

import React from "react";
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
import { DataTable } from "../ui/data-table";
import { UserDataForTable } from "@/types/users/user-types";
import { meterColumns } from "./columns";
import { MeterDataForTable } from "@/types/meters/meter-types";

interface MeterTableProps {
  data: MeterDataForTable[];
  isLoading?: boolean;
  error?: Error | null;
}

export const MeterTable = ({ data, isLoading, error }: MeterTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  console.log(data);

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

  return (
    <DataTable
      columns={meterColumns}
      data={data}
      table={table}
      isLoading={isLoading}
      error={error}
    />
  );
};
