import { useQuery } from "@tanstack/react-query";

export interface ConsumptionData {
  chartData: Array<{
    date: string;
    totalFlow: number;
    instantFlow: number;
    reverseFlow: number;
    readings: number;
  }>;
  metrics: {
    totalConsumption: number;
    averageDailyConsumption: number;
    totalReadings: number;
    period: string;
    dateRange: {
      start: string;
      end: string;
    };
  };
  topMeters: Array<{
    meter_id: string;
    _sum: {
      cumulative_flow: string | null;
    };
    _count: {
      id: number;
    };
  }>;
  period: string;
}

export const useConsumptionData = (period: "7d" | "30d" | "90d" = "7d") => {
  return useQuery<ConsumptionData, Error>({
    queryKey: ["consumption-data", period],
    queryFn: async () => {
      const response = await fetch(
        `/api/dashboard/consumption?period=${period}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch consumption data");
      }
      return response.json();
    },
    refetchInterval: 60000, // Refrescar cada minuto
    staleTime: 30000, // Considerar datos frescos por 30 segundos
  });
};
