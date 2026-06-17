"use client";

import { useState, useEffect } from "react";
import { Loader2, Lock } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  ValveCommandError,
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
  lastSeen?: string | null;
  canOperate?: boolean;
}

const CYCLE_MS = 12 * 60 * 60 * 1000;

function formatRemaining(lastSeen: string): string {
  const remaining = new Date(lastSeen).getTime() + CYCLE_MS - Date.now();
  if (remaining <= 0) return "El medidor debería conectarse en breve";
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (h === 0) return `Próximo ciclo en ~${m}min`;
  return m > 0 ? `Próximo ciclo estimado en ~${h}h ${m}min` : `Próximo ciclo estimado en ~${h}h`;
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

const MQTT_STATUS_CONFIG = {
  SUCCESS: { label: "Enviado", className: "bg-green-100 text-green-800 border-green-200" },
  MQTT_ERROR: { label: "Sin conexión", className: "bg-red-100 text-red-800 border-red-200" },
} as const;

export function ValveControlPanel({
  meterId,
  deviceName,
  currentValveStatus,
  lastSeen,
  canOperate = true,
}: Props) {
  const [pendingCommand, setPendingCommand] =
    useState<ValveCommandType | null>(null);
  const [lastSentCommand, setLastSentCommand] =
    useState<ValveCommandType | null>(null);
  const { toast } = useToast();

  const mutation = useValveCommandMutation(meterId);
  const { data: history, isLoading: historyLoading } =
    useValveHistoryQuery(meterId);

  const valveStatus = resolveValveDisplayStatus(currentValveStatus);
  const statusCfg = STATUS_CONFIG[valveStatus];

  useEffect(() => {
    if (
      (lastSentCommand === "OPEN" && valveStatus === "OPEN") ||
      (lastSentCommand === "CLOSE" && valveStatus === "CLOSED")
    ) {
      setLastSentCommand(null);
    }
  }, [valveStatus, lastSentCommand]);

  const [cycleProgress, setCycleProgress] = useState(0);

  useEffect(() => {
    if (!lastSeen || !lastSentCommand) return;
    function update() {
      const elapsed = Date.now() - new Date(lastSeen!).getTime();
      setCycleProgress(Math.min(100, (elapsed / CYCLE_MS) * 100));
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [lastSeen, lastSentCommand]);

  function handleConfirm() {
    if (!pendingCommand) return;
    mutation.mutate(pendingCommand, {
      onSuccess: () => {
        toast({
          title: "Comando encolado",
          description: `La ${pendingCommand === "OPEN" ? "apertura" : "cierre"} será procesada en el próximo ciclo del medidor.`,
        });
        setLastSentCommand(pendingCommand);
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
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-xs font-medium ${statusCfg.className}`}
            >
              {statusCfg.label}
            </Badge>
            {!mutation.isIdle && (() => {
              const mqttCfg = mutation.error instanceof ValveCommandError
                ? MQTT_STATUS_CONFIG.MQTT_ERROR
                : mutation.data?.status === "SUCCESS"
                ? MQTT_STATUS_CONFIG.SUCCESS
                : null;
              return mqttCfg ? (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium ${mqttCfg.className}`}
                >
                  {mqttCfg.label}
                </Badge>
              ) : null;
            })()}
          </div>
        </div>

        <div className={`relative ${!canOperate ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div>
              <p className="text-sm font-medium text-foreground">
                {valveStatus === "OPEN"
                  ? "Válvula abierta"
                  : valveStatus === "CLOSED"
                  ? "Válvula cerrada"
                  : "Estado incierto"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {valveStatus === "OPEN"
                  ? "Tocá para cerrar"
                  : valveStatus === "CLOSED"
                  ? "Tocá para abrir"
                  : "No se puede operar en este estado"}
              </p>
            </div>

            {mutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <button
                role="switch"
                aria-checked={valveStatus === "OPEN"}
                disabled={valveStatus === "ABNORMAL" || valveStatus === "UNKNOWN"}
                onClick={() =>
                  setPendingCommand(valveStatus === "OPEN" ? "CLOSE" : "OPEN")
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  valveStatus === "OPEN" ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
                    valveStatus === "OPEN" ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
            )}
          </div>
        </div>

        {!canOperate && (
          <div className="px-5 py-3 border-b flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20">
            <Lock className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Permiso de escritura no habilitado — contactá a un administrador
            </p>
          </div>
        )}

        {lastSentCommand && (
          <div className="px-5 py-3 border-b bg-amber-50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Comando de{" "}
                <strong>
                  {lastSentCommand === "OPEN" ? "apertura" : "cierre"}
                </strong>{" "}
                encolado — se ejecutará en el próximo ciclo del medidor
              </p>
            </div>
            {lastSeen && (
              <>
                <div className="w-full bg-amber-200 dark:bg-amber-900/30 rounded-full h-1.5">
                  <div
                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${cycleProgress}%` }}
                  />
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  {formatRemaining(lastSeen)}
                </p>
              </>
            )}
          </div>
        )}

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
                        {dayjs(item.timestamp).tz("America/Argentina/Buenos_Aires").format("DD/MM HH:mm")}
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
