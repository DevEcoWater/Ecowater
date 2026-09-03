export interface ZonePolygonPoint {
  lat: number;
  lng: number;
}

export type ZoneStatus = "ACTIVE" | "UPCOMING" | "INACTIVE";

export interface Zone {
  id: string;
  name: string;
  color: string;
  polygon: ZonePolygonPoint[];
  status: ZoneStatus;
  created_at: string;
  updated_at: string;
  meter_count?: number;
  route_order?: string[] | null;
  route_assignments?: Record<string, string> | null;
  operator_target?: number | null;
}

export interface ZoneMeter {
  id: string;
  dev_eui: string | null;
  device_name: string;
  meter_type: "SMART" | "MECHANICAL";
  street_address: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  userName: string | null;
  shortData: string | null;
  cumulative_flow: string | null;
  month_cumulative_flow: string | null;
  last_reading_value: string | null;
  last_reading_date: string | Date | null;
  last_reading_observations: string | null;
  read_today: boolean;
}
