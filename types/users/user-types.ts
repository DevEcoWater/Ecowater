import { User, UserStatus } from "@prisma/client";

export interface UserFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  address?: string;
  status?: UserStatus;
  coordinates?: {
    lat: number;
    lng: number;
  };
  role_id?: string;
}

export interface UpdateUserData extends UserFormData {
  id: string;
}

export interface UserResponse {
  user: User;
  message?: string;
}

export interface PaginatedUserResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
