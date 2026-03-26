import { Meter, Reading, Status } from "@prisma/client";

export interface MeterDataForTable extends Omit<Meter, ""> {
  userMeter?: TUserMeter;
  connectivity?: {
    status: "ONLINE" | "OFFLINE" | "STALE";
    lastSeen: string | null;
    signalQuality: "EXCELLENT" | "GOOD" | "POOR" | "UNKNOWN";
  };
  dataFreshness?: {
    isRecent: boolean;
    age: string;
    warning: string | null;
  };
}

export interface MeterReading extends Meter {
  reading: StatusReading;
  user?: string;
  userName?: string | null;
  connectivity?: {
    status: "ONLINE" | "OFFLINE" | "STALE";
    lastSeen: string | null;
    signalQuality: "EXCELLENT" | "GOOD" | "POOR" | "UNKNOWN";
  };
  dataFreshness?: {
    isRecent: boolean;
    age: string;
    warning: string | null;
  };
}

export interface StatusReading extends Reading {
  statuses: Status;
  submittedBy?: { firstName: string; lastName: string } | null;
}

type TUserMeter = {
  assigned_at: Date;
  id: string;
  meter_id: string;
  shortData: string;
  userName: string;
  user_id: string;
};

export type MeterType = "SMART" | "MECHANICAL";

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

export interface MechanicalMeterFormData {
  device_name: string;
  street_address: string;
  lat: number;
  lng: number;
  dev_eui?: string;
  status?: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY";
  user_id?: string;
}

export interface ManualReadingFormData {
  instantaneous_flow: string;
  observations?: string;
  photo_url?: string;
  submitted_by: string;
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
