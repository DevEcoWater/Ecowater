import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ValveCommandType,
  ValveCommandResponse,
  ValveHistoryResponse,
} from "@/types/meters/valve-types";

export function useValveCommandMutation(meterId: string) {
  const qc = useQueryClient();
  return useMutation<ValveCommandResponse, Error, ValveCommandType>({
    mutationFn: async (command) => {
      const res = await fetch(`/api/meter/${meterId}/valve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al enviar comando de válvula");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["valve-history", meterId] });
    },
  });
}

export function useValveHistoryQuery(meterId: string) {
  return useQuery<ValveHistoryResponse>({
    queryKey: ["valve-history", meterId],
    queryFn: async () => {
      const res = await fetch(`/api/meter/${meterId}/valve?limit=10`);
      if (!res.ok) throw new Error("Error al obtener historial de válvula");
      return res.json();
    },
    enabled: !!meterId,
    refetchInterval: 30_000,
  });
}
