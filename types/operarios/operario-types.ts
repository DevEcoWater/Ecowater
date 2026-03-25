export type ZoneStatus = "ACTIVE" | "UPCOMING" | "INACTIVE";

export interface Operario {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  role: string;
  created_at?: string;
  readings_total?: number;
  readings_this_week?: number;
  last_reading_at?: string | Date | null;
  assignedZones: {
    id: string;
    name: string;
    color: string;
    status?: ZoneStatus;
  }[];
}

export interface OperarioReading {
  id: string;
  timestamp: string | Date;
  instantaneous_flow: string | null;
  consumption: number | null;
  observations: string | null;
  meter_id: string;
  meter_name: string | null;
  meter_address: string | null;
}

export interface OperatorZone {
  id: string;
  name: string;
  color: string;
  status: ZoneStatus;
  meter_count: number;
  operator_count: number;
}

export interface ReadingRouteItem {
  id: string;
  device_name: string;
  street_address: string | null;
  lat: number | null;
  lng: number | null;
  userName: string | null;
  userId: string | null;
  last_reading_value: string | null;
  last_reading_date: string | Date | null;
  read_today: boolean;
  reading_time_today: string | Date | null;
}

export interface ReadingRouteResponse {
  zone: { id: string; name: string; color: string };
  meters: ReadingRouteItem[];
  total: number;
  read_count: number;
}

export interface OperarioFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
