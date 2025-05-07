"use client";

import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { User } from "@prisma/client";
import { UserColumn, UserDetail } from "@/types/users/user-types";

// Combine the types UserDetail and UserColumn into one type.
const usernameColumn: ColumnDef<User> = {
  id: "username",
  header: "Usuario",
  cell: ({ row }) => {
    const user = row.original;
    return (
      <div>
        {user.firstName} {user.lastName}
      </div>
    );
  },
};

const otherColumns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return new Date(date).toLocaleDateString("es-ES");
    },
  },
  {
    accessorKey: "status",
    header: "Estado del usuario",
    cell: ({ row }) => {
      const status = row.original.status;
      return <span>{status}</span>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <button>Actions for {user.firstName}</button>
        </div>
      );
    },
  },
];

// `userColumns` must now be typed for `User` directly, not `CombinedUser`
export const userColumns: ColumnDef<User>[] = [usernameColumn, ...otherColumns];
