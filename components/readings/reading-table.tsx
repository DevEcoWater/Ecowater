"use client";

import React, { useState } from "react";
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
import { getReadingColumns } from "./columns";

interface ReadingTableProps {
  data: any[];
  isLoading?: boolean;
  error?: Error | null;
  meterType?: "SMART" | "MECHANICAL";
}

export const ReadingTable = ({ data, isLoading, error, meterType = "SMART" }: ReadingTableProps) => {
  const columns = getReadingColumns(meterType);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: data || [],
    columns,
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
      columns={columns}
      data={data}
      table={table}
      isLoading={isLoading}
      error={error}
    />
  );
};
