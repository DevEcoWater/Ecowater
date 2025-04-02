"use client";

import {
  MoreHorizontal,
  User2,
  NotebookPen,
  Gauge,
  Trash2,
} from "lucide-react";
import { Button } from "../ui/button";
import { User } from "@/types/usuarios/user-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface UserActionsProps {
  user: User;
  onViewDetails?: (user: User) => void;
  onEdit?: (user: User) => void;
  onViewMeter?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export const UserActions = ({
  user,
  onViewDetails,
  onEdit,
  onViewMeter,
  onDelete,
}: UserActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onViewDetails?.(user)}
        >
          <User2 className="h-4 w-4" />
          Detalle del usuario
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onEdit?.(user)}
        >
          <NotebookPen className="h-4 w-4" />
          Editar usuario
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onViewMeter?.(user)}
        >
          <Gauge className="h-4 w-4" />
          Medidor asignado
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onDelete?.(user)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          Eliminar usuario
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
