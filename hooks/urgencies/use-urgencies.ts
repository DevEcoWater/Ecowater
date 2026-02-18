import { useQuery } from "@tanstack/react-query";

export type UrgencyParams = {
  meterId?: string;
  limit?: number;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  types?: string;
  includeInactive?: boolean;
  context?: "dashboard" | "detail";
};

export type Alert = {
  type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  field: string;
  value: any;
  meter: {
    id: string;
    device_name: string;
    dev_eui: string;
    status: string;
    operational_status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    address: string;
  } | null;
  reading: {
    id: string;
    timestamp: string;
    alarm_status: string | null;
    error_code: string | null;
  };
  created_at: string;
  dataFreshness: {
    isRecent: boolean;
    age: string;
    warning: string | null;
  };
  connectivity: {
    status: "ONLINE" | "OFFLINE" | "STALE";
    lastSeen: string | null;
    signalQuality: "EXCELLENT" | "GOOD" | "POOR" | "UNKNOWN";
  };
};

export type UrgencyResponse = {
  alerts: {
    critical: Alert[];
    high: Alert[];
    medium: Alert[];
    low: Alert[];
    inactive: Alert[];
  };
  meta: {
    total: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    inactiveCount: number;
    meterId: string;
    limit: number;
    context: "dashboard" | "detail";
  };
  systemHealth: "EXCELLENT" | "GOOD" | "ATTENTION" | "CRITICAL";
};

/**
 * Hook para obtener urgencias con filtros flexibles
 */
export function useUrgencies(params: UrgencyParams = {}) {
  return useQuery<UrgencyResponse>({
    queryKey: ["urgencies", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.meterId) searchParams.set("meterId", params.meterId);
      if (params.limit) searchParams.set("limit", params.limit.toString());
      if (params.severity) searchParams.set("severity", params.severity);
      if (params.types) searchParams.set("types", params.types);
      if (params.includeInactive) searchParams.set("includeInactive", "true");
      if (params.context) searchParams.set("context", params.context);

      const response = await fetch(`/api/urgencies?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch urgencies");
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refetch cada minuto
  });
}

/**
 * Hook para obtener urgencias críticas únicamente
 */
export function useCriticalUrgencies(
  params: Omit<UrgencyParams, "severity"> = {}
) {
  return useUrgencies({ ...params, severity: "CRITICAL" });
}

/**
 * Hook para obtener urgencias de un medidor específico
 */
export function useMeterUrgencies(
  meterId: string,
  params: Omit<UrgencyParams, "meterId"> = {}
) {
  return useUrgencies({ ...params, meterId });
}

/**
 * Hook para dashboard (últimas lecturas, incluye inactivos)
 */
export function useDashboardUrgencies() {
  return useUrgencies({
    limit: 20,
    includeInactive: true,
    context: "dashboard",
  });
}

/**
 * Hook para detalle de medidor (incluye alertas históricas)
 */
export function useMeterDetailUrgencies(meterId: string) {
  return useUrgencies({
    meterId,
    includeInactive: true,
    context: "detail",
  });
}

/**
 * Hook para obtener urgencias por tipo específico
 */
export function useUrgenciesByType(
  types: string[],
  params: Omit<UrgencyParams, "types"> = {}
) {
  return useUrgencies({
    ...params,
    types: types.join(","),
  });
}
