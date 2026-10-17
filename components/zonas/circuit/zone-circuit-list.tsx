"use client";

import { ChevronUp, ChevronDown, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CircuitDraftEntry } from "@/types/zones/circuit-types";

interface ZoneCircuitListProps {
  entries: CircuitDraftEntry[];
  onRemove: (meterId: string) => void;
  onMoveUp: (meterId: string) => void;
  onMoveDown: (meterId: string) => void;
  onClear: () => void;
}

export function ZoneCircuitList({
  entries,
  onRemove,
  onMoveUp,
  onMoveDown,
  onClear,
}: ZoneCircuitListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12 px-4">
        <MapPin className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Hacé click en los medidores del mapa para definir el orden de visita
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium text-muted-foreground">
          {entries.length} medidor{entries.length !== 1 ? "es" : ""} en el circuito
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={onClear}
        >
          Limpiar
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y">
        {entries.map((entry, idx) => (
          <div
            key={entry.meterId}
            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 group"
          >
            <Badge
              variant="secondary"
              className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs font-bold shrink-0"
            >
              {entry.order}
            </Badge>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{entry.device_name}</p>
              {entry.street_address && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.street_address}
                </p>
              )}
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={idx === 0}
                onClick={() => onMoveUp(entry.meterId)}
              >
                <ChevronUp className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={idx === entries.length - 1}
                onClick={() => onMoveDown(entry.meterId)}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => onRemove(entry.meterId)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
