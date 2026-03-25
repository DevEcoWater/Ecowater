"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, Lock, LockOpen } from "lucide-react";

interface ValveCommandsCardProps {
  meterId: string;
}

/**
 * ValveCommandsCard — UI placeholder para el pack "Control de válvulas".
 * La lógica de envío de comandos LoRaWAN se implementa en V2.
 */
export function ValveCommandsCard({ meterId }: ValveCommandsCardProps) {
  const [valveState, setValveState] = useState<"open" | "closed" | "loading">("open");

  const handleCommand = async (command: "open" | "close") => {
    setValveState("loading");
    // TODO V2: enviar comando LoRaWAN al medidor via API
    // await fetch(`/api/meter/${meterId}/commands`, {
    //   method: "POST",
    //   body: JSON.stringify({ command }),
    // });
    await new Promise((r) => setTimeout(r, 1500)); // simulación
    setValveState(command === "open" ? "open" : "closed");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Control de válvula</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Estado actual</span>
          <Badge
            variant={valveState === "open" ? "default" : valveState === "closed" ? "secondary" : "outline"}
          >
            {valveState === "loading"
              ? "Procesando..."
              : valveState === "open"
              ? "Abierta"
              : "Cerrada"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={valveState === "loading" || valveState === "open"}
            onClick={() => handleCommand("open")}
            className="flex items-center gap-2"
          >
            {valveState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockOpen className="h-4 w-4" />
            )}
            Abrir
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={valveState === "loading" || valveState === "closed"}
            onClick={() => handleCommand("close")}
            className="flex items-center gap-2"
          >
            {valveState === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Cerrar
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Los comandos se envían al medidor vía LoRaWAN. La respuesta puede demorar hasta 60 segundos.
        </p>
      </CardContent>
    </Card>
  );
}
