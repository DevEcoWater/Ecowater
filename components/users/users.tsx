"use client";

import React from "react";
import { DataTable } from "../ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { chipConfig, MeterStatus } from "@/utils/getChipColor";
import Chip from "../ui/chip";
import { useUsers } from "@/hooks/useUsers";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton";
import { CircleArrowRight } from "lucide-react";
import { Button } from "../ui/button";

const Users = () => {
  const { data, isLoading, isError, error } = useUsers();

  if (isLoading) return <Skeleton className="h-[260px] w-full bg-gray-300" />;
  if (isError) return <p>Error: {error?.message}</p>;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "_id",
      header: "ID",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "status",
      header: "Estado actual",
      cell: ({ row }) => {
        const status = row.original.meter.status as MeterStatus;
        const { label } = chipConfig[status];
        return <Chip status={status} text={label} />;
      },
    },
    {
      accessorKey: "status",
      header: "Estado actual",
      cell: ({ row }) => {
        return (
          <Link
            className="flex gap-2"
            href={`/dashboard/usuario/medidor/${row.original.meter._id}`}
          >
            <Button>
              Detalle
              <CircleArrowRight />
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="py-10">
      <DataTable columns={columns} data={data ?? []} />
    </div>
  );
};

export default Users;
