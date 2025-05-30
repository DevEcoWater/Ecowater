"use client";

import { useRouter } from "next/navigation";
import { User } from "@prisma/client";

import { MoreHorizontal, User2, Gauge, UserPlus } from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { UserDataForTable } from "@/types/users/user-types";
import { MeterDataForTable } from "@/types/meters/meter-types";

interface MeterActionsProps {
  meter: MeterDataForTable;
  onViewDetails?: (user: MeterDataForTable) => void;
  onEdit?: (MeterDataForTable: MeterDataForTable) => void;
  onViewMeter?: (MeterDataForTable: MeterDataForTable) => void;
  onDelete?: (MeterDataForTable: User) => void;
}

export const MeterActions = ({ meter }: MeterActionsProps) => {
  const router = useRouter();

  const handleViewMeter = () => {
    router.push(`/dashboard/medidores/${meter.id}`);
  };

  const handleViewUser = () => {
    router.push(`/dashboard/usuarios/detalle/${meter.userMeter.user_id}`);
  };

  console.log(meter, "meter");

  return (
    <>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} collisionPadding={10}>
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          {meter.userMeter ? (
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={handleViewUser}
            >
              <User2 className="h-4 w-4" />
              Detalle de usuario
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Asignar usuario
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={handleViewMeter}
          >
            <Gauge className="h-4 w-4" />
            Detalle del medidor
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
