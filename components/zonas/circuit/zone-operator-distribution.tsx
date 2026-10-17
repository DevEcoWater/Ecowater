"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CircuitDraftEntry, CircuitOperatorDTO } from "@/types/zones/circuit-types";

interface ZoneOperatorDistributionProps {
  entries: CircuitDraftEntry[];
  operators: CircuitOperatorDTO[];
  operatorColorMap: Record<string, string>;
  onDistributeEvenly: () => void;
  onReassign: (meterId: string, newOperatorId: string | null) => void;
}

// ── Droppable column ───────────────────────────────────────────────────────────

function OperatorColumn({
  operatorId,
  label,
  color,
  entries,
}: {
  operatorId: string | null;
  label: string;
  color: string;
  entries: CircuitDraftEntry[];
}) {
  const id = operatorId ?? "unassigned";
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-lg border bg-muted/30 min-w-[180px] flex-1 transition-colors ${
        isOver ? "border-primary bg-primary/5" : ""
      }`}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 border-b rounded-t-lg"
        style={{ borderTopColor: color, borderTopWidth: 3 }}
      >
        <span className="text-sm font-medium truncate flex-1">{label}</span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {entries.length}
        </Badge>
      </div>

      <SortableContext
        items={entries.map((e) => e.meterId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 p-2 space-y-1 min-h-[80px]">
          {entries.map((entry) => (
            <SortableItem key={entry.meterId} entry={entry} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Sortable item ──────────────────────────────────────────────────────────────

function SortableItem({ entry }: { entry: CircuitDraftEntry }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.meterId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-1.5 rounded-md bg-background border px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing"
    >
      <span {...attributes} {...listeners} className="text-muted-foreground shrink-0">
        <GripVertical className="w-3.5 h-3.5" />
      </span>
      <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs shrink-0">
        {entry.order}
      </Badge>
      <span className="truncate text-xs">{entry.device_name}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ZoneOperatorDistribution({
  entries,
  operators,
  operatorColorMap,
  onDistributeEvenly,
  onReassign,
}: ZoneOperatorDistributionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = [
    ...operators.map((op) => ({
      id: op.id,
      label: `${op.firstName} ${op.lastName}`,
      color: operatorColorMap[op.id] ?? "#94a3b8",
      entries: entries.filter((e) => e.assignedOperatorId === op.id),
    })),
    {
      id: null,
      label: "Sin asignar",
      color: "#94a3b8",
      entries: entries.filter((e) => e.assignedOperatorId === null),
    },
  ];

  const activeEntry = activeId ? entries.find((e) => e.meterId === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedMeterId = active.id as string;
    const overId = over.id as string;

    // Determine target column: over.id can be a column id ("unassigned" or operatorId)
    // or a meter id (dropped onto another item → same column, no reassignment needed here)
    const targetOperatorId = operators.find((op) => op.id === overId)?.id ?? null;
    const isColumn = overId === "unassigned" || operators.some((op) => op.id === overId);

    if (isColumn) {
      onReassign(draggedMeterId, targetOperatorId);
      return;
    }

    // Dropped onto another item → find which column owns that item
    const targetEntry = entries.find((e) => e.meterId === overId);
    if (targetEntry && targetEntry.assignedOperatorId !== undefined) {
      onReassign(draggedMeterId, targetEntry.assignedOperatorId);
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) return;
    // Visual feedback is handled by useDroppable isOver
  }

  if (operators.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <Users className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          Asigná al menos 2 operarios a la zona para poder distribuir el circuito
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Primero definí el orden del circuito en el paso anterior
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Arrastrá los medidores entre los paneles para reasignarlos
        </p>
        <Button variant="outline" size="sm" onClick={onDistributeEvenly}>
          Distribuir equitativamente
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((col) => (
            <OperatorColumn
              key={col.id ?? "unassigned"}
              operatorId={col.id}
              label={col.label}
              color={col.color}
              entries={col.entries}
            />
          ))}
        </div>

        <DragOverlay>
          {activeEntry && (
            <div className="flex items-center gap-1.5 rounded-md bg-background border px-2 py-1.5 text-sm shadow-lg">
              <Badge variant="outline" className="w-5 h-5 p-0 flex items-center justify-center text-xs">
                {activeEntry.order}
              </Badge>
              <span className="truncate text-xs">{activeEntry.device_name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
