import { useQuery } from "@tanstack/react-query";

export interface LastUpdateData {
  lastReading: {
    id: string;
    timestamp: string;
    meter: {
      id: string;
      device_name: string;
      status: string;
    };
    user: {
      name: string;
      address: string;
    } | null;
    flow: string | null;
    temperature: string | null;
  } | null;
  lastUser: {
    id: string;
    name: string;
    email: string;
    created_at: string;
    address: string;
  } | null;
  lastMeter: {
    id: string;
    device_name: string;
    status: string;
    created_at: string;
  } | null;
  lastCooperative: {
    id: string;
    name: string;
    location: string | null;
    created_at: string;
  } | null;
  recentActivity: {
    readings: number;
    users: number;
    meters: number;
    total: number;
  };
  systemStatus: {
    lastUpdate: string;
    isOnline: boolean;
    dataFreshness: number | string;
  };
}

export const useLastUpdate = () => {
  return useQuery<LastUpdateData, Error>({
    queryKey: ["last-update"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/last-update");
      if (!response.ok) {
        throw new Error("Failed to fetch last update information");
      }
      return response.json();
    },
    refetchInterval: 15000, // Refrescar cada 15 segundos
    staleTime: 5000, // Considerar datos frescos por 5 segundos
  });
};
