"use client";

import { useState } from "react";
import { AlertTriangle, Activity, Search, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMetersQuery } from "@/hooks/meters/use-meter-query";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { useAssignUserMeterMutation } from "@/hooks/users/use-user-query";

interface AssignMeterModalProps {
  userId: string;
  userName: string;
  currentMeterId?: string;
  isOpen: boolean;
  onClose: () => void;
}

type Step = "select" | "confirm-reassign";

export function AssignMeterModal({
  userId,
  userName,
  currentMeterId,
  isOpen,
  onClose,
}: AssignMeterModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const [selectedMeter, setSelectedMeter] = useState<MeterDataForTable | null>(null);
  const [conflictUser, setConflictUser] = useState<{ id: string; name: string } | null>(null);

  const assignMutation = useAssignUserMeterMutation();

  const { data, isLoading } = useMetersQuery(1, 50, search, "total");
  const meters = (data?.data ?? []) as MeterDataForTable[];

  const handleClose = () => {
    setStep("select");
    setSearch("");
    setSelectedMeter(null);
    setConflictUser(null);
    onClose();
  };

  const handleSelectMeter = (meter: MeterDataForTable) => {
    const assignment = meter.userMeter as any;
    const isAssignedToOtherUser =
      assignment && assignment.user_id !== userId;

    setSelectedMeter(meter);

    if (isAssignedToOtherUser) {
      setConflictUser({ id: assignment.user_id, name: assignment.userName });
      setStep("confirm-reassign");
    } else {
      handleAssign(meter, false);
    }
  };

  const handleAssign = async (meter: MeterDataForTable, force: boolean) => {
    try {
      await assignMutation.mutateAsync({
        userId,
        meterId: meter.id,
        force,
      });
      toast({
        title: "Medidor asignado",
        description: `El medidor ${meter.device_name || meter.dev_eui} fue asignado a ${userName}.`,
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo asignar el medidor.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReassign = () => {
    if (!selectedMeter) return;
    handleAssign(selectedMeter, true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {step === "select" && (
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Asignar medidor a {userName}
            </DialogTitle>
            <DialogDescription>
              Seleccioná un medidor de la lista para asignarlo al usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre o EUI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground text-sm">
                Cargando medidores...
              </div>
            ) : meters.length === 0 ? (
              <div className="flex justify-center py-8 text-muted-foreground text-sm">
                No se encontraron medidores
              </div>
            ) : (
              meters.map((meter) => {
                const assignment = meter.userMeter as any;
                const isCurrentMeter = meter.id === currentMeterId;
                const isAssignedToOther =
                  assignment && assignment.user_id !== userId;

                return (
                  <button
                    key={meter.id}
                    onClick={() => !isCurrentMeter && handleSelectMeter(meter)}
                    disabled={isCurrentMeter || assignMutation.isPending}
                    className="w-full flex items-start justify-between gap-3 p-3 rounded-lg border text-left transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {meter.device_name || "Sin nombre"}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground truncate">
                        {meter.dev_eui}
                      </div>
                      {isAssignedToOther && assignment?.userName && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                          <UserCheck className="h-3 w-3" />
                          Asignado a {assignment.userName}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {isCurrentMeter ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Actual
                        </Badge>
                      ) : isAssignedToOther ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-600 text-xs">
                          Reasignar
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-300 text-green-600 text-xs">
                          Disponible
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      )}

      {step === "confirm-reassign" && selectedMeter && (
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Medidor ya asignado
            </DialogTitle>
            <DialogDescription>
              Este medidor está actualmente asignado a{" "}
              <span className="font-semibold text-foreground">
                {conflictUser?.name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2 text-sm text-amber-800">
            <p className="font-medium">Al confirmar se realizarán los siguientes cambios:</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>
                El medidor{" "}
                <span className="font-mono font-medium">
                  {selectedMeter.device_name || selectedMeter.dev_eui}
                </span>{" "}
                será desasignado de <span className="font-medium">{conflictUser?.name}</span>.
              </li>
              <li>
                Será asignado a{" "}
                <span className="font-medium">{userName}</span>.
              </li>
              {currentMeterId && (
                <li>
                  El medidor actual de {userName} quedará sin usuario asignado.
                </li>
              )}
            </ul>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setStep("select")}
              disabled={assignMutation.isPending}>
              Volver
            </Button>
            <Button
              onClick={handleConfirmReassign}
              disabled={assignMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white">
              {assignMutation.isPending ? "Procesando..." : "Confirmar reasignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
