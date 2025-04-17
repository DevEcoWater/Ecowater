import { Adress, Meter, User } from "@prisma/client";

export interface UserDetail {
  id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  status: string;
  firstName: string;
  lastName: string;
  address: Adress;
  meter: Meter;
  role: string;
}

export interface UserResponse {
  user: UserDetail;
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
