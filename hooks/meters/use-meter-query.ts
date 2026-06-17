import {
  MapMeter,
  MechanicalMeterFormData,
  MeterFormData,
  MeterReading,
  MeterType,
  PaginatedMeterResponse,
} from "@/types/meters/meter-types";
import { Meter } from "@prisma/client";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Function to fetch all meters with pagination
export const useMetersQuery = (
  page = 1,
  limit = 10,
  search: string,
  filter: string,
  type?: MeterType
) => {
  return useQuery<PaginatedMeterResponse, Error>({
    queryKey: ["meters", page, limit, search, filter, type],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        status: filter,
        page: String(page),
        limit: String(limit),
      });
      if (type) params.set("type", type);
      const response = await fetch(`/api/meter?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meters");
      }
      return response.json();
    },
    retry: 3,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
};

// Function to fetch a single meter by ID
export const useMeterQuery = (id: string) => {
  return useQuery<MeterReading, Error>({
    queryKey: ["meter", id],
    queryFn: async () => {
      if (!id) throw new Error("Meter ID is required");

      const response = await fetch(`/api/meter/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meter");
      }

      return response.json();
    },
    enabled: !!id,
  });
};

// Function to fetch meters for a specific user
export const useUserMetersQuery = (userId: string) => {
  return useQuery<Meter[], Error>({
    queryKey: ["userMeters", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const response = await fetch(`/api/user/${userId}/meters`);
      if (!response.ok) {
        throw new Error("Failed to fetch user meters");
      }
      return response.json();
    },
    enabled: !!userId,
  });
};

// Create a new meter
export const useCreateMeterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Meter, Error, MeterFormData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/meter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error creating meter");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    },
  });
};

// Update an existing meter
export const useUpdateMeterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<Meter, Error, { id: string } & MeterFormData>({
    mutationFn: async ({ id, ...data }) => {
      const response = await fetch(`/api/meter/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error updating meter");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      queryClient.invalidateQueries({ queryKey: ["meter", data.id] });
    },
  });
};

// Delete a meter
export const useDeleteMeterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const response = await fetch(`/api/meter/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error deleting meter");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    },
  });
};

// Assign a meter to a user
export const useAssignMeterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<any, Error, { userId: string; meterId: string }>({
    mutationFn: async ({ userId, meterId }) => {
      const response = await fetch(`/api/user/${userId}/meters`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ meterId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error assigning meter to user");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userMeters", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["meter", variables.meterId] });
    },
  });
};

// Create a mechanical meter
export const useCreateMechanicalMeterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Meter, Error, MechanicalMeterFormData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/meter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, meter_type: "MECHANICAL" }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear medidor mecánico");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    },
  });
};

// Submit a manual reading for a mechanical meter
export const useSubmitManualReadingMutation = (meterId: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    { instantaneous_flow: string; observations?: string; photo_url?: string; submitted_by: string }
  >({
    mutationFn: async (data) => {
      const response = await fetch(`/api/meter/${meterId}/readings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar lectura");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meter", meterId] });
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    },
  });
};

/** Fetches all meters that have coordinates — used by the admin map view. */
export const useMapMetersQuery = () => {
  return useQuery<MapMeter[], Error>({
    queryKey: ["meters", "map"],
    queryFn: async () => {
      const res = await fetch("/api/meters/map");
      if (!res.ok) throw new Error("Failed to fetch map meters");
      return res.json();
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
  });
};

// Update a mechanical meter (device_name, street_address, dev_eui, lat, lng)
export const useUpdateMechanicalMeterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<Meter, Error, { id: string } & MechanicalMeterFormData>({
    mutationFn: async ({ id, ...data }) => {
      const response = await fetch(`/api/meter/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar medidor mecánico");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meters"] });
      queryClient.invalidateQueries({ queryKey: ["meter", data.id] });
    },
  });
};

// Legacy hooks for backward compatibility
export function useMeter(id: string) {
  return useMeterQuery(id);
}

export const useMeterMutation = useCreateMeterMutation;
