export type ValveCommandType = "OPEN" | "CLOSE";
export type ValveDisplayStatus = "OPEN" | "CLOSED" | "ABNORMAL" | "UNKNOWN";
export type ValveResult = "SENT" | "FAILED";

export interface ValveHistoryItem {
  id: string;
  timestamp: string;
  user_email: string;
  action: "VALVE_OPEN" | "VALVE_CLOSE";
  result: ValveResult;
  error: string | null;
}

export interface ValveHistoryResponse {
  data: ValveHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValveCommandRequest {
  command: ValveCommandType;
}

export interface ValveCommandResponse {
  success: boolean;
  topic: string;
  action: string;
}

export function resolveValveDisplayStatus(
  raw: string | null | undefined
): ValveDisplayStatus {
  switch (raw?.toLowerCase()) {
    case "open":
      return "OPEN";
    case "closed":
      return "CLOSED";
    case "abnormal":
      return "ABNORMAL";
    default:
      return "UNKNOWN";
  }
}
