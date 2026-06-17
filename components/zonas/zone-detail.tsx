"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useZoneQuery,
  useZoneMetersQuery,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useZoneReadingRouteQuery,
} from "@/hooks/zones/use-zones";
import { ZoneMeter } from "@/types/zones/zone-types";
import { Button } from "@/components/ui/button";
import { ZoneDownloadSection } from "@/components/zonas/zone-download-section";
import { ZoneOperatorSection } from "@/components/zonas/zone-operator-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ToastAction } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  Gauge,
  HardHat,
  MapPin,
  MoreVertical,
  Navigation,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { MeterTypeChip } from "@/components/ui/meter-type-chip";

import Chip from "@/components/ui/chip";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { usePageHeader } from "@/context/page-header-context";
import {
  getCurrentBimesterRange,
  getPreviousBimesterRange,
  isSamePeriod,
} from "@/lib/bimester";
import { formatDateInputAR } from "@/lib/utils";

interface ZoneDetailProps {
  id: string;
}

const ZONES_QUERY_KEY = ["zones"];

export function ZoneDetail({ id }: ZoneDetailProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const { setPageHeader } = usePageHeader();
  const queryClient = useQueryClient();
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentBimesterRange);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: zone, isLoading: zoneLoading } = useZoneQuery(id);
  const { data: meters, isLoading: metersLoading } = useZoneMetersQuery(id, selectedPeriod);
  const { data: routeData } = useZoneReadingRouteQuery(id, selectedPeriod);
  const updateZone = useUpdateZoneMutation();
  const deleteZone = useDeleteZoneMutation();

  const currentBimesterPeriod = getCurrentBimesterRange();
  const previousBimesterPeriod = getPreviousBimesterRange();
  const isCurrentBimesterSelected = isSamePeriod(selectedPeriod, currentBimesterPeriod);
  const isPreviousBimesterSelected = isSamePeriod(selectedPeriod, previousBimesterPeriod);

  useEffect(() => {
    if (zone) {
      setPageHeader(zone.name, "Medidores dentro de esta área geográfica");
    }
  }, [zone, setPageHeader]);

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

  const handleDelete = () => {
    // Snapshot the current list for potential undo restore
    const snapshot = queryClient.getQueryData<unknown[]>(ZONES_QUERY_KEY);

    // Optimistically remove the zone from the list cache
    queryClient.setQueryData<unknown[]>(ZONES_QUERY_KEY, (old) =>
      old?.filter((z: any) => z.id !== id)
    );

    // Navigate away immediately so the UI feels instant
    router.push("/dashboard/zonas");

    const { id: toastId, dismiss: dismissToast } = toast({
      title: "Zona eliminada",
      action: (
        <ToastAction
          altText="Deshacer"
          onClick={() => {
            if (deleteTimerRef.current !== null) {
              clearTimeout(deleteTimerRef.current);
              deleteTimerRef.current = null;
            }
            // Restore the snapshot
            queryClient.setQueryData(ZONES_QUERY_KEY, snapshot);
            dismissToast();
          }}
        >
          Deshacer
        </ToastAction>
      ),
    });

    // Schedule the real DELETE after 6 seconds
    deleteTimerRef.current = setTimeout(async () => {
      deleteTimerRef.current = null;
      try {
        await deleteZone.mutateAsync(id);
        queryClient.invalidateQueries({ queryKey: ZONES_QUERY_KEY });
        dismiss(toastId);
      } catch {
        // Restore the snapshot on network failure
        queryClient.setQueryData(ZONES_QUERY_KEY, snapshot);
        toast({ title: "Error al eliminar zona", variant: "destructive" });
      }
    }, 6000);
  };

  const completedAt = routeData?.completed_at
    ? new Date(routeData.completed_at).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // ── Loading & not-found states ─────────────────────────────────────────────

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

  // ── Main layout ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-8">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      {editing ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={editColor}
            onChange={(e) => setEditColor(e.target.value)}
            className="w-9 h-9 rounded cursor-pointer border"
          />
          <div className="flex items-center gap-2">
            <Label htmlFor="edit-name" className="sr-only">
              Nombre
            </Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-56"
              autoFocus
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={saveEdit}
            disabled={updateZone.isPending}
          >
            <Check className="w-4 h-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" onClick={cancelEdit}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow flex-shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            <h1 className="text-2xl font-bold tracking-tight">{zone.name}</h1>
            <Badge variant="outline" className="text-xs">
              {zone.status}
            </Badge>
          </div>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={startEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar nombre y color
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar zona
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar zona?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará la zona &quot;{zone.name}&quot;
                  permanentemente. Los medidores no serán afectados.
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
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-4">
            <Gauge className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{meters?.length ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Medidores en la zona</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-4">
            <HardHat className="w-8 h-8 text-purple-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{routeData?.operator_count ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Operarios asignados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-4">
            <MapPin className="w-8 h-8 text-amber-500 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Estado del período</p>
              {routeData?.completed ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit text-xs">
                  Completada{completedAt ? ` ${completedAt}` : ""}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 w-fit text-xs">
                  Pendiente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Period selector ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Label className="text-sm font-medium">Período</Label>
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

      {/* ── Route CTA ─────────────────────────────────────────────────────── */}
      <div>
        <Button
          variant="outline"
          className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
          asChild
        >
          <Link href={`/dashboard/zonas/${id}/ruta`}>
            <Navigation className="w-4 h-4" />
            Configurar ruta de lectura
          </Link>
        </Button>
      </div>

      {/* ── Card: Medidores ───────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm bg-white dark:bg-card">
        <CardHeader className="px-6 pt-6 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-500" />
            Medidores en la zona
            {!metersLoading && meters && (
              <span className="text-muted-foreground font-normal text-sm">
                ({meters.length})
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Acumulado para el período {formatDateInputAR(selectedPeriod.startDate)} →{" "}
            {formatDateInputAR(selectedPeriod.endDate)}
          </p>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {metersLoading ? (
            <div className="space-y-2 px-6 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !meters || meters.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-8 text-center">
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
                  <TableHead>Acumulado del período (m³)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {meters.map((m: ZoneMeter) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <MeterTypeChip type={m.meter_type} />
                    </TableCell>
                    <TableCell>{m.device_name}</TableCell>
                    <TableCell>{m.userName ?? "—"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {m.meter_type === "MECHANICAL"
                        ? (m.street_address ?? "—")
                        : (m.shortData ?? "—")}
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
        </CardContent>
      </Card>

      {/* ── Card: Descargas ───────────────────────────────────────────────── */}
      <Card className="border-0 shadow-sm bg-white dark:bg-card">
        <CardContent className="p-0 overflow-hidden">
          <ZoneDownloadSection
            zoneId={id}
            zoneName={zone.name}
            meters={meters}
            periodStart={selectedPeriod.startDate}
            periodEnd={selectedPeriod.endDate}
          />
        </CardContent>
      </Card>

      {/* ── Card: Operarios ───────────────────────────────────────────────── */}
      <ZoneOperatorSection zoneId={id} />

    </div>
  );
}
