"use client";

import { Loader2 } from "lucide-react";
import { ValveControlPanel } from "@/components/meters/valve-control-panel";
import { cn } from "@/lib/utils";
import { useUpdateMeterHasValveMutation } from "@/hooks/meters/use-meter-query";
import { useToast } from "@/hooks/use-toast";

interface ValveCommandsCardProps {
  meterId: string;
  deviceName: string;
  hasValve: boolean;
  currentValveStatus: string | null;
  lastSeen?: string | null;
  canOperate?: boolean;
}

export function ValveCommandsCard({
  meterId,
  deviceName,
  hasValve,
  currentValveStatus,
  lastSeen,
  canOperate,
}: ValveCommandsCardProps) {
  const { toast } = useToast();
  const mutation = useUpdateMeterHasValveMutation();

  function setHasValve(next: boolean) {
    mutation.mutate(
      { id: meterId, has_valve: next },
      {
        onError: (err) =>
          toast({
            title: "No se pudo actualizar",
            description: err.message,
            variant: "destructive",
          }),
      }
    );
  }

  const capability = (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">
          Este medidor tiene válvula
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {hasValve
            ? "El control de apertura y cierre está habilitado."
            : "Sin válvula no hay control de apertura ni cierre."}
        </p>
      </div>
      {mutation.isPending ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <button
          role="switch"
          aria-checked={hasValve}
          aria-label="Este medidor tiene válvula"
          disabled={!canOperate}
          onClick={() => setHasValve(!hasValve)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-40",
            hasValve ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
          )}
        >
          <span
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200",
              hasValve ? "translate-x-5" : "translate-x-0.5"
            )}
          />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {capability}
      {hasValve && (
        <ValveControlPanel
          meterId={meterId}
          deviceName={deviceName}
          currentValveStatus={currentValveStatus}
          lastSeen={lastSeen}
          canOperate={canOperate}
        />
      )}
    </div>
  );
}
