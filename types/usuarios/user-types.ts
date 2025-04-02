import type { MeterStatus } from "@prisma/client";

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: Date;
  status: UserStatus;
  role: string;
  meter?: {
    id: string;
    status: MeterStatus;
  };
}

export interface UserColumn {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
  status: "pending" | "processing" | "success" | "failed";
  role: string;
}

export interface UserCounts {
  total: number;
  activos: number;
  inactivos: number;
}
