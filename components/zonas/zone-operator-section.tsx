"use client";

import { useState } from "react";
import { HardHat, Minus, Plus, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAllOperariosQuery } from "@/hooks/operarios/use-operarios";
import {
  useAssignOperarioToZone,
  useRemoveOperarioFromZone,
} from "@/hooks/zones/use-zones";
import Link from "next/link";

interface ZoneOperatorSectionProps {
  zoneId: string;
}

export function ZoneOperatorSection({ zoneId }: ZoneOperatorSectionProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: allOperarios = [], isLoading } = useAllOperariosQuery();
  const assignMutation = useAssignOperarioToZone();
  const removeMutation = useRemoveOperarioFromZone();
  const assigned = allOperarios.filter((op) =>
    op.assignedZones.some((z) => z.id === zoneId)
  );
  const available = allOperarios
    .filter((op) => !op.assignedZones.some((z) => z.id === zoneId))
    .filter((op) =>
      search
        ? `${op.firstName} ${op.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase())
        : true
    );

  const handleAssign = async (operarioId: string) => {
    try {
      await assignMutation.mutateAsync({ operarioId, zoneId });
      toast({ title: "Operario asignado correctamente" });
    } catch (e: unknown) {
      toast({
        title: e instanceof Error ? e.message : "Error al asignar operario",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (operarioId: string) => {
    try {
      await removeMutation.mutateAsync({ operarioId, zoneId });
      toast({ title: "Operario removido" });
    } catch {
      toast({ title: "Error al remover operario", variant: "destructive" });
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white dark:bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HardHat className="h-4 w-4 text-purple-500" />
            Operarios asignados
            {assigned.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {assigned.length}
              </Badge>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Asigná y remové operarios directamente desde esta zona.
        </p>
      </CardHeader>

      <CardContent className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 px-6 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border rounded-lg overflow-hidden">

            {/* ── Left panel: Assigned ──────────────────────────────── */}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Asignados ({assigned.length})
              </p>

              {assigned.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Sin operarios asignados.
                </p>
              ) : (
                <ul className="space-y-1">
                  {assigned.map((op) => (
                    <li
                      key={op.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-bold shrink-0">
                          {op.firstName[0]}
                          {op.lastName[0]}
                        </div>
                        <Link
                          href={`/dashboard/operarios/${op.id}`}
                          className="text-sm font-medium hover:underline truncate"
                        >
                          {op.firstName} {op.lastName}
                        </Link>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-red-50"
                        onClick={() => handleRemove(op.id)}
                        disabled={removeMutation.isPending}
                        title="Remover de la zona"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Right panel: Available ────────────────────────────── */}
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Disponibles ({available.length})
              </p>

              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Buscar operario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {search
                    ? "Sin resultados para esa búsqueda."
                    : "Todos los operarios están asignados."}
                </p>
              ) : (
                <ul className="space-y-1">
                  {available.map((op) => (
                    <li
                      key={op.id}
                      className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                          {op.firstName[0]}
                          {op.lastName[0]}
                        </div>
                        <span className="text-sm truncate">
                          {op.firstName} {op.lastName}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAssign(op.id)}
                        disabled={assignMutation.isPending}
                        title="Asignar a esta zona"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
