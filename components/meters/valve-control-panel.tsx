"use client";

import { useState } from "react";
import { Lock, LockOpen, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  useValveCommandMutation,
  useValveHistoryQuery,
} from "@/hooks/meters/use-valve-control";
import {
  ValveCommandType,
  ValveDisplayStatus,
  resolveValveDisplayStatus,
} from "@/types/meters/valve-types";

interface Props {
  meterId: string;
  deviceName: string;
  currentValveStatus: string | null;
}

const STATUS_CONFIG: Record<
  ValveDisplayStatus,
  { label: string; className: string }
> = {
  OPEN: { label: "Abierta", className: "bg-green-100 text-green-800 border-green-200" },
  CLOSED: { label: "Cerrada", className: "bg-red-100 text-red-800 border-red-200" },
  ABNORMAL: { label: "Anormal", className: "bg-orange-100 text-orange-800 border-orange-200" },
  UNKNOWN: { label: "Desconocido", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const ACTION_CONFIG: Record<
  "VALVE_OPEN" | "VALVE_CLOSE",
  { label: string; className: string }
> = {
  VALVE_OPEN: { label: "Apertura", className: "bg-green-100 text-green-800" },
  VALVE_CLOSE: { label: "Cierre", className: "bg-red-100 text-red-800" },
};

const RESULT_CONFIG: Record<
  "SENT" | "FAILED",
  { label: string; className: string }
> = {
  SENT: { label: "Enviado", className: "bg-blue-100 text-blue-800" },
  FAILED: { label: "Fallido", className: "bg-red-100 text-red-800" },
};

export function ValveControlPanel({
  meterId,
  deviceName,
  currentValveStatus,
}: Props) {
  const [pendingCommand, setPendingCommand] =
    useState<ValveCommandType | null>(null);
  const { toast } = useToast();

  const mutation = useValveCommandMutation(meterId);
  const { data: history, isLoading: historyLoading } =
    useValveHistoryQuery(meterId);

  const valveStatus = resolveValveDisplayStatus(currentValveStatus);
  const statusCfg = STATUS_CONFIG[valveStatus];

  function handleConfirm() {
    if (!pendingCommand) return;
    mutation.mutate(pendingCommand, {
      onSuccess: () => {
        toast({
          title: "Comando enviado",
          description: `Válvula ${pendingCommand === "OPEN" ? "abierta" : "cerrada"} correctamente.`,
        });
        setPendingCommand(null);
      },
      onError: (err) => {
        toast({
          title: "Error al enviar comando",
          description: err.message,
          variant: "destructive",
        });
        setPendingCommand(null);
      },
    });
  }

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Control de Válvula
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{deviceName}</p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-medium ${statusCfg.className}`}
          >
            {statusCfg.label}
          </Badge>
        </div>

        <div className="flex gap-3 px-5 py-4 border-b">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 border-green-300 text-green-700 hover:bg-green-50"
            disabled={mutation.isPending}
            onClick={() => setPendingCommand("OPEN")}
          >
            {mutation.isPending && pendingCommand === "OPEN" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
            Abrir válvula
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-2 border-red-300 text-red-700 hover:bg-red-50"
            disabled={mutation.isPending}
            onClick={() => setPendingCommand("CLOSE")}
          >
            {mutation.isPending && pendingCommand === "CLOSE" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Cerrar válvula
          </Button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Historial de comandos
          </p>

          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded" />
              ))}
            </div>
          ) : !history?.data?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin comandos registrados
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Acción</TableHead>
                  <TableHead className="text-xs">Resultado</TableHead>
                  <TableHead className="text-xs">Usuario</TableHead>
                  <TableHead className="text-xs text-right">Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((item) => {
                  const actionCfg = ACTION_CONFIG[item.action];
                  const resultCfg = RESULT_CONFIG[item.result];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${actionCfg.className}`}
                        >
                          {actionCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${resultCfg.className}`}
                        >
                          {resultCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                        {item.user_email}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground text-right whitespace-nowrap">
                        {dayjs(item.timestamp).format("DD/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <AlertDialog
        open={pendingCommand !== null}
        onOpenChange={(open) => !open && setPendingCommand(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCommand === "OPEN"
                ? "Abrir válvula"
                : "Cerrar válvula"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Esta acción enviará un comando de{" "}
                  <strong>
                    {pendingCommand === "OPEN" ? "apertura" : "cierre"}
                  </strong>{" "}
                  al medidor <strong>{deviceName}</strong> vía MQTT.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>El comando afecta la infraestructura física del medidor</li>
                  <li>La acción queda registrada en el sistema de auditoría</li>
                  <li>Verificá que el medidor sea el correcto antes de confirmar</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className={
                pendingCommand === "OPEN"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
