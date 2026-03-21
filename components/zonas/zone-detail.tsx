"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useZoneQuery, useZoneMetersQuery, useUpdateZoneMutation, useDeleteZoneMutation } from "@/hooks/zones/use-zones";
import { ZoneMeter } from "@/types/zones/zone-types";
import { downloadZoneCsv } from "@/lib/export-csv";
import { Button } from "@/components/ui/button";
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
import { Download, Pencil, Trash2, Check, X } from "lucide-react";
import Chip from "@/components/ui/chip";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { usePageHeader } from "@/context/page-header-context";

interface ZoneDetailProps {
  id: string;
}

export function ZoneDetail({ id }: ZoneDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { setPageHeader } = usePageHeader();
  const { data: zone, isLoading: zoneLoading } = useZoneQuery(id);
  const { data: meters, isLoading: metersLoading } = useZoneMetersQuery(id);
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

  const handleDownloadCsv = () => {
    if (!zone || !meters) return;
    downloadZoneCsv(zone.name, meters);
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
            <Button size="sm" variant="ghost" onClick={startEdit} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editar nombre
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsv}
            disabled={!meters || meters.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar CSV
          </Button>

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
        <h2 className="text-lg font-semibold mb-3">
          Medidores en la zona{" "}
          {!metersLoading && meters && (
            <span className="text-muted-foreground font-normal text-sm">
              ({meters.length})
            </span>
          )}
        </h2>

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
                <TableHead>DEV EUI</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Flujo Acumulado (m³)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {meters.map((m: ZoneMeter) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">{m.dev_eui}</TableCell>
                  <TableCell>{m.device_name}</TableCell>
                  <TableCell>{m.userName ?? "—"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.shortData ?? "—"}</TableCell>
                  <TableCell>{m.cumulative_flow ?? "—"}</TableCell>
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
    </div>
  );
}
