import {
  Meter,
  MeterFormData,
  PaginatedMeterResponse,
} from "@/types/meters/meter-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Function to fetch all meters with pagination
export const useMetersQuery = (page = 1, limit = 10) => {
  return useQuery<PaginatedMeterResponse, Error>({
    queryKey: ["meters", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/meter?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch meters");
      }
      return response.json();
    },
  });
};

// Function to fetch a single meter by ID
export const useMeterQuery = (id: string) => {
  return useQuery<Meter, Error>({
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

// Legacy hooks for backward compatibility
export function useMeter(id: string) {
  return useMeterQuery(id);
}

export function useMeters() {
  return useMetersQuery();
}

export const useMeterMutation = useCreateMeterMutation;
