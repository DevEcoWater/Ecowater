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
import { User } from "@prisma/client"; // This is the type of user
import { userColumns } from "./columns"; // Assuming columns are based on user type
import { DataTable } from "../ui/data-table";

interface UserTableProps {
  data: User[]; // Ensure data is typed as User[]
  isLoading?: boolean;
  error?: Error | null;
}

export const UserTable = ({ data, isLoading, error }: UserTableProps) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data || [], // Ensure data is properly typed as User[]
    columns: userColumns, // Pass the correctly typed columns
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
      columns={userColumns} // Make sure columns match the table data type
      data={data}
      table={table}
      isLoading={isLoading}
      error={error}
    />
  );
};
