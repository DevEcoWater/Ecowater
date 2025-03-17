import {
  useMutation,
  UseMutationResult,
  useQuery,
} from "@tanstack/react-query";
import { Coordinates } from "./useUsers";

export interface MeterFormData {
  userId: string;
  status: "active" | "inactive" | "error";
  address: string;
  coordinates: Coordinates;
}

export function useMeter(id: string) {
  return useQuery({
    queryKey: ["meter", id],
    queryFn: async () => {
      const response = await fetch(`/api/get-meter/${id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch meter");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useMeters() {
  return useQuery({
    queryKey: ["meters-list"],
    queryFn: async () => {
      const response = await fetch("/api/get-meters", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch meters");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export const useMeterMutation = (): UseMutationResult<
  void,
  Error,
  MeterFormData
> => {
  // Function to create a meter
  const createMeter = async (data: MeterFormData): Promise<void> => {
    const response = await fetch("/api/meters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error creating meter.");
    }
  };

  // Mutation hook with success and error handling
  return useMutation<void, Error, MeterFormData>({
    mutationFn: createMeter,
    onSuccess: () => {},
    onError: (error) => {},
  });
};
