"use client";

import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { MoreHorizontal, User2, Gauge, Pencil, PowerOff, Power } from "lucide-react";
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
import { useUpdateMeterStatusMutation } from "@/hooks/meters/use-meter-query";
import { useToast } from "@/hooks/use-toast";

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
  status?: string;
};

export const MeterActions = ({ meter }: MeterActionsProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const statusMutation = useUpdateMeterStatusMutation();

  const isMechanical = meter.meter_type === "MECHANICAL";
  const isActive = meter.status === "ACTIVE";
  const hasUser = !!meter.user_id;

  const handleViewMeter = () => {
    router.push(`/dashboard/medidores/${meter.meter_id}`);
  };

  const handleViewUser = () => {
    router.push(`/dashboard/usuarios/${meter.user_id}`);
  };

  const handleEditMeter = () => {
    router.push(`/dashboard/medidores/mecanicos/${meter.meter_id}/editar`);
  };

  const handleToggleStatus = async () => {
    const nextStatus = isActive ? "INACTIVE" : "ACTIVE";
    try {
      await statusMutation.mutateAsync({ id: meter.meter_id, status: nextStatus });
      toast({
        title: nextStatus === "ACTIVE" ? "Medidor activado" : "Medidor desactivado",
      });
    } catch (err: any) {
      toast({
        title: "No se pudo cambiar el estado",
        description: err.message,
        variant: "destructive",
      });
    }
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

            {/* Activate / Deactivate — only for mechanical meters */}
            {!isActive && !hasUser ? (
              <DropdownMenuItem disabled className="flex items-center gap-2 text-muted-foreground">
                <Power className="h-4 w-4" />
                Asigná un usuario para activar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2"
                onSelect={handleToggleStatus}
                disabled={statusMutation.isPending}
              >
                {isActive ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Activar
                  </>
                )}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
