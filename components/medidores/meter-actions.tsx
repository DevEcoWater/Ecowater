"use client";

import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { MoreHorizontal, User2, Gauge, Pencil } from "lucide-react";
import { MeterTypeChip } from "../ui/meter-type-chip";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MeterDataForTable } from "@/types/meters/meter-types";

interface MeterActionsProps {
  meter: TMeterInfo;
  onViewDetails?: (user: MeterDataForTable) => void;
  onEdit?: (MeterDataForTable: MeterDataForTable) => void;
  onViewMeter?: (MeterDataForTable: MeterDataForTable) => void;
  onDelete?: (MeterDataForTable: User) => void;
}

type TMeterInfo = {
  meter_id: string;
  user_id?: string;
  meter_type?: string;
  device_name?: string;
  street_address?: string;
  dev_eui?: string;
};

export const MeterActions = ({ meter }: MeterActionsProps) => {
  const router = useRouter();

  const isMechanical = meter.meter_type === "MECHANICAL";

  const handleViewMeter = () => {
    router.push(`/dashboard/medidores/${meter.meter_id}`);
  };

  const handleViewUser = () => {
    router.push(`/dashboard/usuarios/${meter.user_id}`);
  };

  const handleEditMeter = () => {
    router.push(`/dashboard/medidores/mecanicos/${meter.meter_id}/editar`);
  };

  return (
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
        <DropdownMenuLabel className="flex items-center gap-2">
          <MeterTypeChip type={meter.meter_type ?? "SMART"} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {meter.user_id ? (
          <DropdownMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onSelect={handleViewUser}
          >
            <User2 className="h-4 w-4" />
            Detalle de usuario
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            No hay usuario asociado
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          className="cursor-pointer flex items-center gap-2"
          onSelect={handleViewMeter}
        >
          <Gauge className="h-4 w-4" />
          Detalle del medidor
        </DropdownMenuItem>

        {isMechanical && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2"
              onSelect={handleEditMeter}
            >
              <Pencil className="h-4 w-4" />
              Editar medidor
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
