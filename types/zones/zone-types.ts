export interface ZonePolygonPoint {
  lat: number;
  lng: number;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  polygon: ZonePolygonPoint[];
  created_at: string;
  updated_at: string;
  meter_count?: number;
}

export interface ZoneMeter {
  id: string;
  dev_eui: string;
  device_name: string;
  lat: number | null;
  lng: number | null;
  status: string;
  userName: string | null;
  shortData: string | null;
  cumulative_flow: string | null;
}
