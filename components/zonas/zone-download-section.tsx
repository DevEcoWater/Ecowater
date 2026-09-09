"use client";

import { useState, useEffect } from "react";
import { Download, Pencil, Check, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  useZoneDownloads,
  useCreateZoneDownload,
  useUpdateZoneDownload,
  ZoneDownload,
} from "@/hooks/zones/use-zone-downloads";
import { downloadZoneCsv } from "@/lib/export-csv";
import { formatDateInputAR, formatDateTimeShortAR } from "@/lib/utils";
import { ZoneMeter } from "@/types/zones/zone-types";

const PAGE_SIZE = 8;

function toDateInput(isoString: string): string {
  return isoString.slice(0, 10);
}

interface ZoneDownloadSectionProps {
  zoneId: string;
  zoneName: string;
  meters: ZoneMeter[] | undefined;
  periodStart: string;
  periodEnd: string;
}

export function ZoneDownloadSection({
  zoneId,
  zoneName,
  meters,
  periodStart,
  periodEnd,
}: ZoneDownloadSectionProps) {
  const { toast } = useToast();
  const { data: downloads, isLoading } = useZoneDownloads(zoneId);
  const createDownload = useCreateZoneDownload(zoneId);
  const updateDownload = useUpdateZoneDownload(zoneId);

  // Pagination state
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil((downloads?.length ?? 0) / PAGE_SIZE);
  const pagedDownloads = downloads?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when the list length changes (new download recorded)
  useEffect(() => {
    setPage(1);
  }, [downloads?.length]);

  // Download dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Edit row state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const openDialog = () => {
    setNotes("");
    setDialogOpen(true);
  };

  const handleDownloadAndSave = async () => {
    if (!meters) return;
    try {
      downloadZoneCsv(zoneName, meters, {
        startDate: periodStart,
        endDate: periodEnd,
      }, notes.trim() || undefined);
      await createDownload.mutateAsync({
        period_start: periodStart,
        period_end: periodEnd,
        meter_count: meters.length,
        notes: notes.trim() || undefined,
      });
      toast({ title: "Descarga registrada correctamente" });
      setDialogOpen(false);
    } catch {
      toast({
        title: "Error al registrar la descarga",
        variant: "destructive",
      });
    }
  };

  const startEdit = (d: ZoneDownload) => {
    setEditingId(d.id);
    setEditStart(toDateInput(d.period_start));
    setEditEnd(toDateInput(d.period_end));
    setEditNotes(d.notes ?? "");
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (downloadId: string) => {
    try {
      await updateDownload.mutateAsync({
        download_id: downloadId,
        period_start: editStart,
        period_end: editEnd,
        notes: editNotes.trim() || "Sin observaciones",
      });
      setEditingId(null);
      toast({ title: "Descarga actualizada" });
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between rounded-md border p-3 mb-4">
        <div className="text-xs text-muted-foreground">
          CSV del periodo {formatDateInputAR(periodStart)} {"->"}{" "}
          {formatDateInputAR(periodEnd)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={openDialog}
          disabled={!meters || meters.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Descargar CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de descargas
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : !downloads || downloads.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay descargas registradas aún.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha de descarga</TableHead>
              <TableHead>Período facturado</TableHead>
              <TableHead className="text-center">Medidores</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-[90px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(pagedDownloads ?? []).map((d) =>
              editingId === d.id ? (
                <TableRow key={d.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTimeShortAR(d.downloaded_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        type="date"
                        value={editStart}
                        onChange={(e) => setEditStart(e.target.value)}
                        className="h-7 w-36 text-xs"
                      />
                      <span className="text-muted-foreground text-xs">→</span>
                      <Input
                        type="date"
                        value={editEnd}
                        onChange={(e) => setEditEnd(e.target.value)}
                        className="h-7 w-36 text-xs"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{d.meter_count}</TableCell>
                  <TableCell>
                    <Input
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Observaciones..."
                      className="h-7 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => saveEdit(d.id)}
                        disabled={updateDownload.isPending}>
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={cancelEdit}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={d.id}>
                  <TableCell className="text-sm">
                    {formatDateTimeShortAR(d.downloaded_at)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDateInputAR(toDateInput(d.period_start))} →{" "}
                    {formatDateInputAR(toDateInput(d.period_end))}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {d.meter_count}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => startEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={
                    page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Download dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar descarga CSV</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Periodo seleccionado</Label>
              <p className="text-sm text-muted-foreground">
                {formatDateInputAR(periodStart)} {"->"}{" "}
                {formatDateInputAR(periodEnd)}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Observaciones (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Ej: Facturación bimestral enero-febrero"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Se descargarán los datos de{" "}
              <strong>{meters?.length ?? 0} medidores</strong> y la descarga
              quedará registrada en el historial.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDownloadAndSave}
              disabled={createDownload.isPending}>
              <Download className="w-4 h-4 mr-2" />
              Descargar y registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
