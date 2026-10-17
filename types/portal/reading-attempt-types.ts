export interface ReadingAttemptPayload {
  meter_id: string;
  success: boolean;
  image_path: string;
  value_detected?: string | null;
  error_message?: string | null;
  submitted_by?: string | null;
}

export interface OcrRouteResponse {
  value: string | null;
  error: string | null;
  image_path: string;
}

export type OcrFormState = "idle" | "processing" | "confirming" | "manual_forced";
