import { MeterStatus } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  meters: {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    faulty: number;
    overallStatus: MeterStatus;
  };
  alerts: {
    totalAlerts: number;
    problematicMeters: number;
  };
  consumption: {
    total: number; // m³ del mes actual
    readings: number; // total de lecturas del mes
  };
  systemHealth: "EXCELLENT" | "GOOD" | "ATTENTION";
  lastReadingTimestamp: string | null;
  meta: {
    timestamp: string;
    updatedMeters: {
      deactivated: number;
      activated: number;
    };
  };
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
