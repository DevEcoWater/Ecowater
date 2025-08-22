import { useQuery } from "@tanstack/react-query";

export interface UrgencyData {
  alerts: {
    critical: Array<{
      type: string;
      priority: string;
      meter: {
        id: string;
        device_name: string;
        status: string;
        operational_status?: string;
      };
      user?: {
        name: string;
        address: string;
      };
      lastReading?: {
        timestamp: string;
        flow: number;
        temperature: number;
      };
    }>;
    alarms: Array<{
      type: string;
      priority: string;
      reading: {
        id: string;
        timestamp: string;
        alarm_status: string;
        error_code: string;
      };
      meter: {
        id: string;
        device_name: string;
        status: string;
      };
      user?: {
        name: string;
        address: string;
      };
    }>;
    inactive: Array<{
      type: string;
      priority: string;
      meter: {
        id: string;
        device_name: string;
        status: string;
      };
      user?: {
        name: string;
        address: string;
      };
      lastActivity: string;
    }>;
  };
  urgencyMetrics: {
    totalAlerts: number;
    criticalCount: number;
    alarmCount: number;
    inactiveCount: number;
    usersAffected: number;
    systemHealth: string;
  };
  usersWithProblems: Array<{
    id: string;
    name: string;
    email: string;
    address: string;
    problemMeters: number;
  }>;
}

async function fetchUrgencies(): Promise<UrgencyData> {
  const response = await fetch("/api/dashboard/urgencies-simple");
  if (!response.ok) {
    throw new Error("Failed to fetch urgencies");
  }
  return response.json();
}

export function useUrgencies() {
  return useQuery({
    queryKey: ["urgencies"],
    queryFn: fetchUrgencies,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000, // Los datos se consideran frescos por 10 segundos
  });
}
