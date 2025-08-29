import { Meter, Reading, Status } from "@prisma/client";

export interface MeterDataForTable extends Omit<Meter, ""> {
  userMeter?: TUserMeter;
}

export interface MeterReading extends Meter {
  reading: StatusReading;
}

interface StatusReading extends Reading {
  statuses: Status;
}

type TUserMeter = {
  assigned_at: Date;
  id: string;
  meter_id: string;
  shortData: string;
  userName: string;
  user_id: string;
};

export interface MeterFormData {
  userId: string;
  status?: "ACTIVE" | "INACTIVE";
  operational_status?: "OPERATIONAL" | "NON_OPERATIONAL";
  lat: number;
  lng: number;
  dev_eui?: string;
  device_name?: string;
  application_id?: string;
  application_name?: string;
}

export interface MeterResponse {
  meter: Meter;
  message?: string;
}

export interface PaginatedMeterResponse {
  data: Meter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  counts: MeterStatusCounts;
}

export type MeterStatusCounts = {
  actives: number;
  inactives: number;
  maintenances: number;
  faultys: number;
};
