import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

export type DashboardPeriod = "7d" | "30d" | "90d" | "6m" | "1y";

interface PeriodParams {
  period: DashboardPeriod;
  startDate?: never;
  endDate?: never;
}

interface RangeParams {
  period?: never;
  startDate: string;
  endDate: string;
}

export type ConsumptionQueryParams = PeriodParams | RangeParams;

export interface ConsumptionData {
  meterId: string; // "all" o UUID específico
  startDate: string; // "2025-01-15"
  endDate: string; // "2025-01-22"
  period: string; // "7d", "30d", "90d", "6m", "1y"
  groupBy: "day" | "month"; // Agrupación temporal
  series: Array<{
    fecha: string; // "2025-01-15"
    consumo_m3: number; // 2.45 (m³)
    medidores_activos: number; // 3
  }>;
  previousTotal?: number; // Total del período anterior (para comparación)
}

function buildConsumptionUrl(params: ConsumptionQueryParams, baseUrl = "/api/dashboard/consumption") {
  const sep = baseUrl.includes("?") ? "&" : "?";
  if ("startDate" in params) {
    const { startDate, endDate } = params;
    const diffDays = dayjs(endDate).diff(dayjs(startDate), "day");
    const groupBy = diffDays > 31 ? "month" : "day";
    return `${baseUrl}${sep}startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`;
  }
  return `${baseUrl}${sep}period=${params.period}`;
}

function consumptionQueryKey(params: ConsumptionQueryParams, ...prefix: string[]) {
  if ("startDate" in params) {
    return [...prefix, "range", params.startDate, params.endDate];
  }
  return [...prefix, "period", params.period];
}

function isRangeEnabled(params: ConsumptionQueryParams) {
  if ("startDate" in params) return !!(params.startDate && params.endDate);
  return true;
}

export const useConsumptionData = (
  params: ConsumptionQueryParams = { period: "30d" }
) => {
  return useQuery<ConsumptionData, Error>({
    queryKey: consumptionQueryKey(params, "consumption-data"),
    queryFn: async () => {
      const response = await fetch(buildConsumptionUrl(params));
      if (!response.ok) throw new Error("Failed to fetch consumption data");
      return response.json();
    },
    enabled: isRangeEnabled(params),
    refetchInterval: 60000,
    staleTime: 30000,
  });
};

export const useConsumptionFromMeterData = (
  meterId: string,
  params: ConsumptionQueryParams
) => {
  return useQuery<ConsumptionData, Error>({
    queryKey: consumptionQueryKey(params, "consumption-data", meterId),
    queryFn: async () => {
      const response = await fetch(
        buildConsumptionUrl(params, `/api/dashboard/consumption?meterId=${meterId}`)
      );

      if (!response.ok) throw new Error("Failed to fetch consumption data");
      return response.json();
    },
    enabled: isRangeEnabled(params),
    refetchInterval: 60000,
    staleTime: 30000,
  });
};
