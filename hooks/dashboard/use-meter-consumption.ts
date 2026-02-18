import { useQuery } from "@tanstack/react-query";

export interface MeterConsumptionData {
  meterId: string;
  startDate: string;
  endDate: string;
  period?: string;
  groupBy: "day" | "week" | "month";
  series: Array<{
    fecha: string;
    consumo_m3: number;
    medidores_activos: number;
  }>;
}

interface UseMeterConsumptionParams {
  meterId: string;
  period?: "7d" | "30d" | "90d" | "1y" | "month";
  startDate?: string;
  endDate?: string;
  groupBy?: "day" | "week" | "month";
}

async function fetchMeterConsumption(
  params: UseMeterConsumptionParams
): Promise<MeterConsumptionData> {
  const searchParams = new URLSearchParams();

  if (params.period) {
    searchParams.set("period", params.period);
  }
  if (params.startDate) {
    searchParams.set("startDate", params.startDate);
  }
  if (params.endDate) {
    searchParams.set("endDate", params.endDate);
  }
  if (params.groupBy) {
    searchParams.set("groupBy", params.groupBy);
  }

  searchParams.set("meterId", params.meterId);

  const response = await fetch(
    `/api/dashboard/consumption?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch meter consumption data");
  }

  return response.json();
}

export function useMeterConsumption(params: UseMeterConsumptionParams) {
  return useQuery({
    queryKey: [
      "meter-consumption",
      params.meterId,
      params.period,
      params.startDate,
      params.endDate,
      params.groupBy,
    ],
    queryFn: () => fetchMeterConsumption(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}

// Hook específico para mes actual (igual que dashboard)
export function useMeterConsumptionCurrentMonth(meterId: string) {
  return useMeterConsumption({
    meterId,
    period: "month",
    groupBy: "day",
  });
}

// Hook específico para últimos 7 días
export function useMeterConsumptionLast7Days(meterId: string) {
  return useMeterConsumption({
    meterId,
    period: "7d",
    groupBy: "day",
  });
}

// Hook específico para últimos 30 días
export function useMeterConsumptionLast30Days(meterId: string) {
  return useMeterConsumption({
    meterId,
    period: "30d",
    groupBy: "day",
  });
}

// Hook para rango personalizado
export function useMeterConsumptionRange(
  meterId: string,
  startDate: string,
  endDate: string,
  groupBy: "day" | "week" | "month" = "day"
) {
  return useMeterConsumption({
    meterId,
    startDate,
    endDate,
    groupBy,
  });
}
