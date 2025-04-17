"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UserResponse,
  PaginatedUserResponse,
  UserDetail,
} from "@/types/users/user-types";
import { User } from "@prisma/client";

// Get All Users
export function useUsersQuery(page = 1, limit = 10) {
  return useQuery<PaginatedUserResponse, Error>({
    queryKey: ["users", page, limit],
    queryFn: async () => {
      const response = await fetch(`/api/user?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });
}

// Get a single user
export function useUserQuery(id: string) {
  return useQuery<UserDetail, Error>({
    queryKey: ["user", id],
    queryFn: async () => {
      if (!id) throw new Error("User ID is required");

      const response = await fetch(`/api/user/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

// Create a new user
export const useUserMutation = () => {
  const queryClient = useQueryClient();

  const createUser = async (data: UserFormData): Promise<UserResponse> => {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error creating user.");
    }

    return response.json();
  };

  return useMutation<UserResponse, Error, UserFormData>({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error creating user:", error.message);
    },
  });
};

// Update an existing user
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  const updateUser = async (data: UpdateUserData): Promise<UserResponse> => {
    const { id, ...userData } = data;

    const response = await fetch(`/api/user/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error updating user.");
    }

    return response.json();
  };

  return useMutation<UserResponse, Error, UpdateUserData>({
    mutationFn: updateUser,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
    },
  });
};

// Delete a user
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  const deactivateUser = async (id: string): Promise<void> => {
    const response = await fetch(`/api/user/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error deactivating user.");
    }
  };

  return useMutation<void, Error, string>({
    mutationFn: deactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error deactivating user:", error.message);
    },
  });
};

// Reactivate a user
export const useReactivateUserMutation = () => {
  const queryClient = useQueryClient();

  const reactivateUser = async (id: string): Promise<void> => {
    const response = await fetch(`/api/user/${id}/reactivate`, {
      method: "PATCH",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error reactivating user.");
    }
  };

  return useMutation<void, Error, string>({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error reactivating user:", error.message);
    },
  });
};
