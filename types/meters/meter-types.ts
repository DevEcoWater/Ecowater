export interface Reading {
  id: string;
  timestamp: string;
  value: number;
  type?: string;
  statuses?: any[];
  rxInfos?: any[];
}

export interface Meter {
  meter: any;
  id: string;
  dev_eui: string;
  device_name: string;
  application_id?: string;
  application_name?: string;
  lat?: number;
  lng?: number;
  created_at: string;
  updated_at: string;
  status: "ACTIVE" | "INACTIVE";
  operational_status: "OPERATIONAL" | "NON_OPERATIONAL";
  readings?: Reading[];
  userMeters?: any[];
}

export interface MeterFormData {
  userId: string;
  status?: "ACTIVE" | "INACTIVE";
  operational_status?: "OPERATIONAL" | "NON_OPERATIONAL";
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  dev_eui?: string;
  device_name?: string;
  application_id?: string;
  application_name?: string;
}

export interface PaginatedMeterResponse {
  data: Meter[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
