import { useQuery } from "@tanstack/react-query";
import { ConsumptionQueryParams } from "./use-consumption-data";

export interface MeterDistributionItem {
  meterId: string;
  name: string;
  devEui: string;
  totalConsumo: number;
}

export interface MeterDistributionData {
  meters: MeterDistributionItem[];
}

export const useMeterDistribution = (
  params: ConsumptionQueryParams = { period: "30d" }
) => {
  const isRange = !params.period;

  const buildUrl = () => {
    const base = "/api/dashboard/meter-distribution";
    if (isRange) {
      const { startDate, endDate } = params as { startDate: string; endDate: string };
      return `${base}?startDate=${startDate}&endDate=${endDate}`;
    }
    return `${base}?period=${params.period}`;
  };

  const queryKey = isRange
    ? ["meter-distribution", "range", (params as any).startDate, (params as any).endDate]
    : ["meter-distribution", "period", params.period];

  return useQuery<MeterDistributionData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildUrl());
      if (!response.ok) throw new Error("Failed to fetch meter distribution");
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
