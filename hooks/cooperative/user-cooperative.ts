import { Cooperative } from "@prisma/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateCooperativeData {
  name?: string;
  location?: string;
  lat?: number | null;
  lng?: number | null;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  website?: string;
  status?: "ACTIVE" | "INACTIVE";
  logo_url?: string;
  primary_color?: string;
}

// Get cooperative data
export function useCooperative() {
  return useQuery({
    queryKey: ["cooperative"],
    queryFn: async (): Promise<Cooperative> => {
      const response = await fetch("/api/cooperative");
      if (!response.ok) {
        throw new Error("Failed to fetch cooperative");
      }
      return response.json();
    },
  });
}

// Update cooperative data
export function useUpdateCooperative() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateCooperativeData): Promise<Cooperative> => {
      const response = await fetch("/api/cooperative", {
        method: "PATCH", // 👈 cambiado de PUT a PATCH
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Failed to update cooperative");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperative"] });
    },
  });
}
