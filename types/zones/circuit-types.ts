export interface CircuitOperatorDTO {
  id: string;
  firstName: string;
  lastName: string;
}

export interface CircuitEntryDTO {
  id: string;
  meterId: string;
  order: number;
  assignedOperatorId: string | null;
  device_name: string;
  street_address: string | null;
  lat: number;
  lng: number;
}

export interface CircuitResponse {
  zoneId: string;
  exists: boolean;
  entries: CircuitEntryDTO[];
  operators: CircuitOperatorDTO[];
}

export interface SaveCircuitPayload {
  entries: Array<{
    meterId: string;
    order: number;
    assignedOperatorId: string | null;
  }>;
}

export interface CircuitDraftEntry {
  meterId: string;
  order: number;
  assignedOperatorId: string | null;
  device_name: string;
  street_address: string | null;
  lat: number;
  lng: number;
}
