import { useQuery } from "@tanstack/react-query";

export interface ConsumptionData {
  meterId: string; // "all" o UUID específico
  startDate: string; // "2025-01-15"
  endDate: string; // "2025-01-22"
  period: string; // "7d", "30d", "90d", "1y"
  groupBy: "day" | "month"; // Agrupación temporal
  series: Array<{
    fecha: string; // "2025-01-15"
    consumo_m3: number; // 2.45 (m³)
    medidores_activos: number; // 3
  }>;
}

export const useConsumptionData = () => {
  return useQuery<ConsumptionData, Error>({
    queryKey: ["consumption-data", "month"],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/consumption?period=month`);
      if (!response.ok) {
        throw new Error("Failed to fetch consumption data");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refrescar cada minuto
    staleTime: 30000, // Considerar datos frescos por 30 segundos
  });
};
