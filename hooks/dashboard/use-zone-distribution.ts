import { useQuery } from "@tanstack/react-query";
import { ConsumptionQueryParams } from "./use-consumption-data";

export interface ZoneDistributionItem {
  zoneId: string;
  name: string;
  color: string;
  totalConsumo: number;
  meterCount: number;
}

export interface ZoneDistributionData {
  zones: ZoneDistributionItem[];
  unzonedTotal: number;
}

export const useZoneDistribution = (
  params: ConsumptionQueryParams = { period: "30d" }
) => {
  const isRange = !params.period;

  const buildUrl = () => {
    const base = "/api/dashboard/zone-distribution";
    if (isRange) {
      const { startDate, endDate } = params as { startDate: string; endDate: string };
      return `${base}?startDate=${startDate}&endDate=${endDate}`;
    }
    return `${base}?period=${params.period}`;
  };

  const queryKey = isRange
    ? ["zone-distribution", "range", (params as any).startDate, (params as any).endDate]
    : ["zone-distribution", "period", params.period];

  return useQuery<ZoneDistributionData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Failed to fetch zone distribution");
      return response.json();
    },
    enabled: isRange
      ? !!(params as any).startDate && !!(params as any).endDate
      : true,
    staleTime: 60 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};
