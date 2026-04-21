"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZoneQuery, useZoneMetersQuery, useUpdateZoneMutation, useDeleteZoneMutation } from "@/hooks/zones/use-zones";
import { ZoneMeter } from "@/types/zones/zone-types";
import { Button } from "@/components/ui/button";
import { ZoneDownloadSection } from "@/components/zonas/zone-download-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, Check, X, Cpu, Wrench, HardHat } from "lucide-react";
import Chip from "@/components/ui/chip";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { usePageHeader } from "@/context/page-header-context";
import ZoneAssignment from "@/components/operarios/zone-assignment";
import { useOperariosQuery } from "@/hooks/operarios/use-operarios";
import { Badge } from "@/components/ui/badge";
import { getTodayDateInputAR } from "@/lib/utils";

interface ZoneDetailProps {
  id: string;
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCurrentBimesterRange(): { startDate: string; endDate: string } {
  const todayAR = getTodayDateInputAR();
  const [year, month] = todayAR.split("-").map(Number);
  const bimesterStartMonth = month % 2 === 0 ? month - 1 : month;
  return {
    startDate: `${year}-${String(bimesterStartMonth).padStart(2, "0")}-01`,
    endDate: todayAR,
  };
}

function getPreviousBimesterRange(): { startDate: string; endDate: string } {
  const todayAR = getTodayDateInputAR();
  const [year, month] = todayAR.split("-").map(Number);
  const now = new Date(year, month - 1, 1);
  const currentStartMonthIdx = (now.getMonth() % 2 === 0 ? now.getMonth() : now.getMonth() - 1);
  const previousStart = new Date(now.getFullYear(), currentStartMonthIdx - 2, 1);
  const previousEnd = new Date(previousStart.getFullYear(), previousStart.getMonth() + 2, 0);
  return {
    startDate: toDateInput(previousStart),
    endDate: toDateInput(previousEnd),
  };
}

function isSamePeriod(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
): boolean {
  return a.startDate === b.startDate && a.endDate === b.endDate;
}

export function ZoneDetail({ id }: ZoneDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setPageHeader } = usePageHeader();
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentBimesterRange);
  const { data: zone, isLoading: zoneLoading } = useZoneQuery(id);
  const { data: meters, isLoading: metersLoading } = useZoneMetersQuery(id, selectedPeriod);
  const { data: operariosData } = useOperariosQuery(1, "");
  // Filter operators assigned to this zone
  const assignedOperarios = operariosData?.data.filter((op) =>
    op.assignedZones.some((z) => z.id === id)
  ) ?? [];
  const updateZone = useUpdateZoneMutation();
  const deleteZone = useDeleteZoneMutation();

  useEffect(() => {
    if (zone) {
      setPageHeader(zone.name, "Medidores dentro de esta área geográfica");
    }
  }, [zone, setPageHeader]);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const currentBimesterPeriod = getCurrentBimesterRange();
  const previousBimesterPeriod = getPreviousBimesterRange();
  const isCurrentBimesterSelected = isSamePeriod(selectedPeriod, currentBimesterPeriod);
  const isPreviousBimesterSelected = isSamePeriod(selectedPeriod, previousBimesterPeriod);

  const startEdit = () => {
    setEditName(zone?.name ?? "");
    setEditColor(zone?.color ?? "#3B82F6");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      await updateZone.mutateAsync({ id, name: editName.trim(), color: editColor });
      setEditing(false);
      toast({ title: "Zona actualizada" });
    } catch {
      toast({ title: "Error al actualizar zona", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteZone.mutateAsync(id);
      toast({ title: "Zona eliminada" });
      router.push("/dashboard/zonas");
    } catch {
      toast({ title: "Error al eliminar zona", variant: "destructive" });
    }
  };


  if (zoneLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!zone) {
    return (
      <div>
        <p className="text-muted-foreground">Zona no encontrada.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/zonas")}>
          Volver a Zonas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {/* Color swatch + edit name/color inline */}
        {editing ? (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border"
            />
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-name" className="sr-only">Nombre</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-56"
                autoFocus
              />
            </div>
            <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateZone.isPending}>
              <Check className="w-4 h-4 text-green-600" />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border flex-shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            <span className="font-medium">{zone.name}</span>
            <Button size="sm" variant="ghost" onClick={startEdit} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editar nombre
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar zona
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar zona?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la zona &quot;{zone.name}&quot; permanentemente.
                  Los medidores no serán afectados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Meters table */}
      <div>
        <div className="mb-3 flex flex-col gap-2">
          <Label>Periodo para tabla y descarga</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={isCurrentBimesterSelected ? "default" : "outline"}
              onClick={() => setSelectedPeriod(currentBimesterPeriod)}
            >
              Bimestre actual
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isPreviousBimesterSelected ? "default" : "outline"}
              onClick={() => setSelectedPeriod(previousBimesterPeriod)}
            >
              Bimestre anterior
            </Button>
            <Input
              type="date"
              className="w-[170px]"
              value={selectedPeriod.startDate}
              onChange={(e) =>
                setSelectedPeriod((prev) => ({ ...prev, startDate: e.target.value }))
              }
            />
            <Input
              type="date"
              className="w-[170px]"
              value={selectedPeriod.endDate}
              onChange={(e) =>
                setSelectedPeriod((prev) => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            Medidores en la zona{" "}
            {!metersLoading && meters && (
              <span className="text-muted-foreground font-normal text-sm">
                ({meters.length})
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Acumulado para el periodo {selectedPeriod.startDate} {"->"} {selectedPeriod.endDate}
          </p>
        </div>

        {metersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !meters || meters.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No hay medidores dentro de esta zona.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Acumulado del periodo (m³)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((m: ZoneMeter) => (
                <TableRow key={m.id}>
                  <TableCell>
                    {m.meter_type === "MECHANICAL" ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        <Wrench className="w-3 h-3" />
                        Mecánico
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                        <Cpu className="w-3 h-3" />
                        Inteligente
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{m.device_name}</TableCell>
                  <TableCell>{m.userName ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {m.meter_type === "MECHANICAL" ? m.street_address ?? "—" : m.shortData ?? "—"}
                  </TableCell>
                  <TableCell>{m.month_cumulative_flow ?? "—"}</TableCell>
                  <TableCell>
                    <Chip status={m.status as any} />
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/medidores/${m.id}`}>Ver</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Download history section */}
      <ZoneDownloadSection
        zoneId={id}
        zoneName={zone.name}
        meters={meters}
        periodStart={selectedPeriod.startDate}
        periodEnd={selectedPeriod.endDate}
      />

      {/* Operators section */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <HardHat className="h-4 w-4" />
          Operarios asignados
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {assignedOperarios.length === 0 && (
            <p className="text-sm text-muted-foreground">Sin operarios asignados.</p>
          )}
          {assignedOperarios.map((op) => (
            <Badge key={op.id} variant="outline" className="flex items-center gap-1.5">
              <HardHat className="h-3 w-3" />
              <Link href={`/dashboard/operarios/${op.id}`} className="hover:underline">
                {op.firstName} {op.lastName}
              </Link>
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Para asignar operarios a esta zona, ve al detalle de cada operario.
        </p>
      </div>
    </div>
  );
}
