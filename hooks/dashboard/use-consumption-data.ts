import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

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
  const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
  const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

  return useQuery<ConsumptionData, Error>({
    queryKey: ["consumption-data", startOfMonth, endOfMonth],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/consumption?startDate=${startOfMonth}&endDate=${endOfMonth}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch consumption data");
      }
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

export const useConsumptionFromMeterData = (
  meterId: string,
  period: "7d" | "30d" | "90d" | "1y"
) => {
  return useQuery<ConsumptionData, Error>({
    queryKey: ["consumption-data", meterId, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/consumption?meterId=${meterId}&period=${period}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch consumption data");
      }
      return response.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
};
