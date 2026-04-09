import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ZoneDownload {
  id: string;
  zone_id: string;
  downloaded_at: string;
  period_start: string;
  period_end: string;
  meter_count: number;
  notes: string | null;
}

export function useZoneDownloads(zoneId: string) {
  return useQuery<ZoneDownload[]>({
    queryKey: ["zone-downloads", zoneId],
    queryFn: async () => {
      const res = await fetch(`/api/zones/${zoneId}/downloads`);
      if (!res.ok) throw new Error("Error al obtener historial de descargas");
      return res.json();
    },
    enabled: !!zoneId,
  });
}

export function useCreateZoneDownload(zoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      period_start: string;
      period_end: string;
      meter_count: number;
      notes?: string;
    }) => {
      const res = await fetch(`/api/zones/${zoneId}/downloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al registrar descarga");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zone-downloads", zoneId] }),
  });
}

export function useUpdateZoneDownload(zoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      download_id: string;
      period_start?: string;
      period_end?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/zones/${zoneId}/downloads`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar descarga");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["zone-downloads", zoneId] }),
  });
}
