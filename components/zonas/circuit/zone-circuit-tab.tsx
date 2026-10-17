"use client";

import { useReducer, useMemo, useState } from "react";
import { Save, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useZoneCircuitQuery, useSaveCircuitMutation, useZoneMetersQuery } from "@/hooks/zones/use-zones";
import { ZoneCircuitMap } from "./zone-circuit-map";
import { ZoneCircuitList } from "./zone-circuit-list";
import { ZoneOperatorDistribution } from "./zone-operator-distribution";
import type { Zone } from "@/types/zones/zone-types";
import type { CircuitDraftEntry, CircuitOperatorDTO } from "@/types/zones/circuit-types";

// ── Operator palette ───────────────────────────────────────────────────────────

const OPERATOR_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16",
];

function buildOperatorColorMap(operators: CircuitOperatorDTO[]): Record<string, string> {
  return Object.fromEntries(
    operators.map((op, i) => [op.id, OPERATOR_COLORS[i % OPERATOR_COLORS.length]])
  );
}

// ── Reducer ────────────────────────────────────────────────────────────────────

type DraftState = {
  entries: CircuitDraftEntry[];
};

type DraftAction =
  | { type: "LOAD"; entries: CircuitDraftEntry[] }
  | { type: "TOGGLE_METER"; meter: { meterId: string; device_name: string; street_address: string | null; lat: number; lng: number } }
  | { type: "REMOVE"; meterId: string }
  | { type: "MOVE_UP"; meterId: string }
  | { type: "MOVE_DOWN"; meterId: string }
  | { type: "CLEAR" }
  | { type: "ASSIGN_OPERATOR"; meterId: string; operatorId: string | null }
  | { type: "DISTRIBUTE_EVENLY"; operators: CircuitOperatorDTO[] };

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "LOAD":
      return { entries: action.entries };

    case "TOGGLE_METER": {
      const exists = state.entries.find((e) => e.meterId === action.meter.meterId);
      if (exists) {
        // Remove and reorder
        const filtered = state.entries.filter((e) => e.meterId !== action.meter.meterId);
        return { entries: filtered.map((e, i) => ({ ...e, order: i + 1 })) };
      }
      // Add at the end
      const newEntry: CircuitDraftEntry = {
        ...action.meter,
        order: state.entries.length + 1,
        assignedOperatorId: null,
      };
      return { entries: [...state.entries, newEntry] };
    }

    case "REMOVE": {
      const filtered = state.entries.filter((e) => e.meterId !== action.meterId);
      return { entries: filtered.map((e, i) => ({ ...e, order: i + 1 })) };
    }

    case "MOVE_UP": {
      const idx = state.entries.findIndex((e) => e.meterId === action.meterId);
      if (idx <= 0) return state;
      const next = [...state.entries];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return { entries: next.map((e, i) => ({ ...e, order: i + 1 })) };
    }

    case "MOVE_DOWN": {
      const idx = state.entries.findIndex((e) => e.meterId === action.meterId);
      if (idx < 0 || idx >= state.entries.length - 1) return state;
      const next = [...state.entries];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return { entries: next.map((e, i) => ({ ...e, order: i + 1 })) };
    }

    case "CLEAR":
      return { entries: [] };

    case "ASSIGN_OPERATOR": {
      return {
        entries: state.entries.map((e) =>
          e.meterId === action.meterId ? { ...e, assignedOperatorId: action.operatorId } : e
        ),
      };
    }

    case "DISTRIBUTE_EVENLY": {
      const { operators } = action;
      if (operators.length === 0) return state;
      const count = state.entries.length;
      const chunkSize = Math.floor(count / operators.length);
      const remainder = count % operators.length;
      let offset = 0;
      const updated = [...state.entries];
      operators.forEach((op, i) => {
        const size = chunkSize + (i < remainder ? 1 : 0);
        for (let j = offset; j < offset + size; j++) {
          updated[j] = { ...updated[j], assignedOperatorId: op.id };
        }
        offset += size;
      });
      return { entries: updated };
    }

    default:
      return state;
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface ZoneCircuitTabProps {
  zoneId: string;
  zone: Zone;
}

export function ZoneCircuitTab({ zoneId, zone }: ZoneCircuitTabProps) {
  const { data: circuitData, isLoading: circuitLoading } = useZoneCircuitQuery(zoneId);
  const { data: allMeters, isLoading: metersLoading } = useZoneMetersQuery(zoneId);
  const saveCircuit = useSaveCircuitMutation(zoneId);

  const [state, dispatch] = useReducer(draftReducer, { entries: [] });
  const [initialized, setInitialized] = useState(false);
  const { toast } = useToast();

  // Load server state into draft on first fetch
  if (!circuitLoading && !initialized && circuitData) {
    dispatch({ type: "LOAD", entries: circuitData.entries.map((e) => ({
      meterId: e.meterId,
      order: e.order,
      assignedOperatorId: e.assignedOperatorId,
      device_name: e.device_name,
      street_address: e.street_address,
      lat: e.lat,
      lng: e.lng,
    })) });
    setInitialized(true);
  }

  const operators = circuitData?.operators ?? [];
  const operatorColorMap = useMemo(() => buildOperatorColorMap(operators), [operators]);

  const candidateMeters = useMemo(
    () => (allMeters ?? []).filter((m) => m.meter_type === "MECHANICAL" && m.lat != null && m.lng != null),
    [allMeters]
  );

  const isDirty = useMemo(() => {
    if (!circuitData) return state.entries.length > 0;
    if (state.entries.length !== circuitData.entries.length) return true;
    return state.entries.some((e, i) => {
      const s = circuitData.entries[i];
      return e.meterId !== s.meterId || e.order !== s.order || e.assignedOperatorId !== s.assignedOperatorId;
    });
  }, [state.entries, circuitData]);

  const showDistributeTab = operators.length >= 2 && state.entries.length > 0;

  async function handleSave() {
    try {
      await saveCircuit.mutateAsync({
        entries: state.entries.map((e) => ({
          meterId: e.meterId,
          order: e.order,
          assignedOperatorId: e.assignedOperatorId,
        })),
      });
      toast({ title: "Circuito guardado" });
    } catch {
      toast({ title: "Error al guardar el circuito", variant: "destructive" });
    }
  }

  if (circuitLoading || metersLoading) {
    return <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">Cargando circuito...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {candidateMeters.length} medidores mecánicos disponibles
          </span>
        </div>
        <Button
          size="sm"
          disabled={!isDirty || saveCircuit.isPending}
          onClick={handleSave}
          className="gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          {saveCircuit.isPending ? "Guardando..." : "Guardar circuito"}
        </Button>
      </div>

      {isDirty && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-1.5">
          Tenés cambios sin guardar
        </p>
      )}

      <Tabs defaultValue="order">
        <TabsList>
          <TabsTrigger value="order">1. Definir orden</TabsTrigger>
          {showDistributeTab && (
            <TabsTrigger value="distribute">2. Asignar operarios</TabsTrigger>
          )}
        </TabsList>

        {/* Step 1: define circuit order */}
        <TabsContent value="order" className="mt-4">
          <div className="grid grid-cols-[1fr_280px] gap-4" style={{ height: 480 }}>
            <div className="rounded-lg overflow-hidden border">
              <ZoneCircuitMap
                zoneColor={zone.color}
                zonePolygon={zone.polygon}
                candidateMeters={candidateMeters}
                draftEntries={state.entries}
                operatorColorMap={operatorColorMap}
                onMeterClick={(meterId) => {
                  const meter = candidateMeters.find((m) => m.id === meterId);
                  if (!meter || meter.lat == null || meter.lng == null) return;
                  dispatch({
                    type: "TOGGLE_METER",
                    meter: {
                      meterId: meter.id,
                      device_name: meter.device_name,
                      street_address: meter.street_address,
                      lat: meter.lat,
                      lng: meter.lng,
                    },
                  });
                }}
              />
            </div>
            <div className="rounded-lg border overflow-hidden">
              <ZoneCircuitList
                entries={state.entries}
                onRemove={(meterId) => dispatch({ type: "REMOVE", meterId })}
                onMoveUp={(meterId) => dispatch({ type: "MOVE_UP", meterId })}
                onMoveDown={(meterId) => dispatch({ type: "MOVE_DOWN", meterId })}
                onClear={() => dispatch({ type: "CLEAR" })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Step 2: assign operators */}
        {showDistributeTab && (
          <TabsContent value="distribute" className="mt-4">
            <ZoneOperatorDistribution
              entries={state.entries}
              operators={operators}
              operatorColorMap={operatorColorMap}
              onDistributeEvenly={() => dispatch({ type: "DISTRIBUTE_EVENLY", operators })}
              onReassign={(meterId, operatorId) =>
                dispatch({ type: "ASSIGN_OPERATOR", meterId, operatorId })
              }
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
