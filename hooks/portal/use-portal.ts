import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OperatorZone, ReadingRouteResponse } from "@/types/operarios/operario-types";

// ── Operator portal queries ───────────────────────────────────────────────────

export function useOperatorZonesQuery() {
  return useQuery<OperatorZone[]>({
    queryKey: ["portal", "zones"],
    queryFn: async () => {
      const res = await fetch("/api/operarios/zones");
      if (!res.ok) throw new Error("Error al obtener zonas");
      return res.json();
    },
  });
}

export function useReadingRouteQuery(zoneId: string | null) {
  return useQuery<ReadingRouteResponse>({
    queryKey: ["portal", "reading-route", zoneId],
    queryFn: async () => {
      const res = await fetch(
        `/api/operarios/zones/${zoneId}/reading-route`
      );
      if (!res.ok) throw new Error("Error al obtener ruta de lectura");
      return res.json();
    },
    enabled: !!zoneId,
  });
}

// ── Manual reading submission ─────────────────────────────────────────────────

interface ManualReadingInput {
  meterId: string;
  instantaneous_flow: string;
  observations?: string;
  photo_url?: string;
  submitted_by: string;
}

export function useSubmitReadingMutation(zoneId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      meterId,
      ...data
    }: ManualReadingInput) => {
      const res = await fetch(`/api/meter/${meterId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al guardar lectura");
      }
      return res.json();
    },
    onSuccess: () => {
      if (zoneId) {
        qc.invalidateQueries({ queryKey: ["portal", "reading-route", zoneId] });
      }
    },
  });
}

// ── OCR ───────────────────────────────────────────────────────────────────────

export function useOcrMutation(meterId: string) {
  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const res = await fetch(`/api/meter/${meterId}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const data = await res.json();
      return data as { value: string | null; rawText?: string; error?: string };
    },
  });
}
