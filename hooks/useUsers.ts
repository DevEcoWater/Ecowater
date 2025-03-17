import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  _id: string;
  email: string;
  status: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserFormData {
  username: string;
  email: string;
  address: string;
  coordinates: Coordinates;
}

export interface UserResponse {
  user: {
    _id: string;
    address: string;
    coordinates: Coordinates;
  };
}

export function useUsers() {
  return useQuery<User[], Error>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/get-users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });
}

export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const createUser = async (data: UserFormData): Promise<UserResponse> => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error creating user.");
    }

    return response.json();
  };

  return useMutation<UserResponse, Error, UserFormData, unknown>({
    mutationFn: createUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Corrected invalidateQueries usage
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
      alert("Failed to create user.");
    },
  });
};
