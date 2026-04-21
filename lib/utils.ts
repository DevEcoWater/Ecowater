import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TZ = "America/Argentina/Buenos_Aires";

/** Fecha + hora en horario Argentina. Ej: "22/03/2026, 14:13:05" */
export function formatDateTimeAR(date: Date | string): string {
  return new Date(date).toLocaleString("es-ES", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "medium",
  });
}

/** Solo fecha en horario Argentina. Ej: "22/03/2026" */
export function formatDateAR(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Fecha + hora corta en horario Argentina. Ej: "22/03/26, 14:13" */
export function formatDateTimeShortAR(date: Date | string): string {
  return new Date(date).toLocaleString("es-ES", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** YYYY-MM-DD en zona horaria Argentina (UTC-3). */
export function getTodayDateInputAR(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Formatea YYYY-MM-DD sin conversion de zona (evita corrimientos de dia). */
export function formatDateInputAR(dateInput: string): string {
  const [year, month, day] = dateInput.slice(0, 10).split("-");
  if (!year || !month || !day) return dateInput;
  return `${day}/${month}/${year}`;
}
