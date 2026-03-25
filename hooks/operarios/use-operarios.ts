import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Operario,
  OperarioFormData,
  OperarioReading,
} from "@/types/operarios/operario-types";

const OPERARIOS_KEY = ["operarios"];

export function useOperariosQuery(page = 1, search = "") {
  return useQuery<{
    data: Operario[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: [...OPERARIOS_KEY, page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
        ...(search && { search }),
      });
      const res = await fetch(`/api/operarios?${params}`);
      if (!res.ok) throw new Error("Error al obtener operarios");
      return res.json();
    },
  });
}

export function useOperarioQuery(id: string | null) {
  return useQuery<Operario>({
    queryKey: [...OPERARIOS_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/operarios/${id}`);
      if (!res.ok) throw new Error("Error al obtener operario");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateOperarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: OperarioFormData) => {
      const res = await fetch("/api/operarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al crear operario");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: OPERARIOS_KEY }),
  });
}

export function useUpdateOperarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<OperarioFormData> & { id: string }) => {
      const res = await fetch(`/api/operarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error al actualizar operario");
      return res.json();
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: OPERARIOS_KEY });
      qc.invalidateQueries({ queryKey: [...OPERARIOS_KEY, id] });
    },
  });
}

export function useDeleteOperarioMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/operarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desactivar operario");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: OPERARIOS_KEY }),
  });
}

export function useAssignZoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      operarioId,
      zone_id,
    }: {
      operarioId: string;
      zone_id: string;
    }) => {
      const res = await fetch(`/api/operarios/${operarioId}/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone_id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al asignar zona");
      }
      return res.json();
    },
    onSuccess: (_data, { operarioId }) => {
      qc.invalidateQueries({ queryKey: [...OPERARIOS_KEY, operarioId] });
    },
  });
}

export function useRemoveZoneMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      operarioId,
      zoneId,
    }: {
      operarioId: string;
      zoneId: string;
    }) => {
      const res = await fetch(
        `/api/operarios/${operarioId}/zones/${zoneId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Error al eliminar asignación");
    },
    onSuccess: (_data, { operarioId }) => {
      qc.invalidateQueries({ queryKey: [...OPERARIOS_KEY, operarioId] });
    },
  });
}

export function useOperarioReadingsQuery(id: string | null) {
  return useQuery<OperarioReading[]>({
    queryKey: [...OPERARIOS_KEY, id, "readings"],
    queryFn: async () => {
      const res = await fetch(`/api/operarios/${id}/readings`);
      if (!res.ok) throw new Error("Error al obtener lecturas");
      return res.json();
    },
    enabled: !!id,
  });
}
