import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ConsumptionQueryParams } from "./use-consumption-data";

export interface AlarmDataPoint {
  fecha: string;
  flujo_inverso: number;
  tuberia_vacia: number;
  bateria_baja: number;
  alarma_temperatura: number;
  fuera_de_rango: number;
}

export interface AlarmTrendsData {
  series: AlarmDataPoint[];
  groupBy: "day" | "month";
}

export const useAlarmTrends = (
  params: ConsumptionQueryParams = { period: "30d" }
) => {
  const isRange = !params.period;

  const buildUrl = () => {
    const base = "/api/dashboard/alarms";
    if (isRange) {
      const { startDate, endDate } = params as { startDate: string; endDate: string };
      return `${base}?startDate=${startDate}&endDate=${endDate}`;
    }
    return `${base}?period=${params.period}`;
  };

  const queryKey = isRange
    ? ["alarm-trends", "range", (params as any).startDate, (params as any).endDate]
    : ["alarm-trends", "period", params.period];

  return useQuery<AlarmTrendsData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Failed to fetch alarm trends");
      return response.json();
    },
    enabled: isRange
      ? !!(params as any).startDate && !!(params as any).endDate
      : true,
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
  });
};
