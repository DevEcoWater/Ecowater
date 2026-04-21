import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Zone, ZoneMeter, ZonePolygonPoint } from "@/types/zones/zone-types";

const ZONES_KEY = ["zones"];

// ── Queries ──────────────────────────────────────────────────────────────────

export function useZonesQuery() {
  return useQuery<Zone[]>({
    queryKey: ZONES_KEY,
    queryFn: async () => {
      const res = await fetch("/api/zones");
      if (!res.ok) throw new Error("Error al obtener zonas");
      return res.json();
    },
  });
}

export function useZoneQuery(id: string | null) {
  return useQuery<Zone>({
    queryKey: [...ZONES_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/zones/${id}`);
      if (!res.ok) throw new Error("Error al obtener zona");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useMeterZoneQuery(meterId: string | null) {
  return useQuery<Zone | null>({
    queryKey: ["meter-zone", meterId],
    queryFn: async () => {
      const res = await fetch(`/api/meter/${meterId}/zone`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!meterId,
  });
}

export function useZoneMetersQuery(
  id: string | null,
  period?: { startDate: string; endDate: string }
) {
  return useQuery<ZoneMeter[]>({
    queryKey: [...ZONES_KEY, id, "meters", period?.startDate, period?.endDate],
    queryFn: async () => {
      const query = period
        ? `?startDate=${encodeURIComponent(period.startDate)}&endDate=${encodeURIComponent(period.endDate)}`
        : "";
      const res = await fetch(`/api/zones/${id}/meters${query}`);
      if (!res.ok) throw new Error("Error al obtener medidores de la zona");
      return res.json();
    },
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

interface CreateZoneInput {
  name: string;
  color: string;
  polygon: ZonePolygonPoint[];
}

export function useCreateZoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateZoneInput) => {
      const res = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Error al crear zona");
      return res.json() as Promise<Zone>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}

interface UpdateZoneInput {
  id: string;
  name?: string;
  color?: string;
  polygon?: ZonePolygonPoint[];
}

export function useUpdateZoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateZoneInput) => {
      const res = await fetch(`/api/zones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar zona");
      return res.json() as Promise<Zone>;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ZONES_KEY });
      qc.invalidateQueries({ queryKey: [...ZONES_KEY, id] });
    },
  });
}

export function useDeleteZoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/zones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar zona");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ZONES_KEY }),
  });
}
