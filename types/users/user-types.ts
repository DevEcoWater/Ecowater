import { Address, Meter, User, UserStatus } from "@prisma/client";

export interface UserDetail {
  id: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  status: UserStatus;
  firstName: string;
  lastName: string;
  address?: Address;
  meter?: Meter;
  role?: string;
}

export interface UserColumn
  extends Omit<
    UserDetail,
    "password" | "updated_at" | "address" | "meter" | "role"
  > {}

export type CreateUserFormValues = Omit<
  UserDetail,
  "id" | "address" | "created_at" | "updated_at" | "status"
> & {
  address: Omit<Address, "id">;
};

export type UpdateUserFormValues = Omit<
  Partial<UserDetail>,
  "address" | "meter"
> & {
  id: string; // ✅ user.id is required for the PUT call
  address?: Omit<Address, "id">; // ✅ still omit address.id
};

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
  counts: TCounts;
}
export type TCounts = {
  actives: number;
  inactives: number;
  pendings: number;
  blockeds: number;
};
