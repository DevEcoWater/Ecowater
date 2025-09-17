import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    pending: number;
    blocked: number;
  };
  meters: {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    faulty: number;
  };
  cooperatives: {
    total: number;
    active: number;
    inactive: number;
  };
  readings: {
    total: number;
    recent: number;
  };
  alerts: {
    problematicMeters: number;
    totalAlerts: number;
  };
  summary: {
    totalEntities: number;
    systemHealth: "EXCELLENT" | "GOOD" | "ATTENTION";
  };
  lastReadingTimestamp: string | null;
}

export const useDashboardStats = () => {
  return useQuery<DashboardStats, Error>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }
      return response.json();
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000, // Considerar datos frescos por 10 segundos
  });
};
