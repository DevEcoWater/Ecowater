import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a Unix timestamp (in seconds) to Argentina timezone ISO string
 * @param timestamp - Unix timestamp in seconds
 * @returns ISO string in Argentina timezone (UTC-3)
 */
export const convertTimestampToArgentinaTime = (timestamp: number): string => {
  return dayjs(timestamp * 1000)
    .tz("America/Argentina/Buenos_Aires")
    .format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};

/**
 * Converts a Unix timestamp (in seconds) to a specific timezone ISO string
 * @param timestamp - Unix timestamp in seconds
 * @param timezone - Timezone string (e.g., "America/Argentina/Buenos_Aires")
 * @returns ISO string in the specified timezone
 */
export const convertTimestampToTimezone = (
  timestamp: number,
  timezone: string
): string => {
  return dayjs(timestamp * 1000)
    .tz(timezone)
    .format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};

/**
 * Converts a Unix timestamp (in seconds) to UTC ISO string
 * @param timestamp - Unix timestamp in seconds
 * @returns ISO string in UTC
 */
export const convertTimestampToUTC = (timestamp: number): string => {
  return dayjs(timestamp * 1000).toISOString();
};

export function formatReadingAge(
  timestamp: Date | string | null | undefined
): string {
  if (!timestamp) return "Sin lecturas";
  const date = new Date(timestamp as string);
  if (isNaN(date.getTime())) return "Sin lecturas";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);
  const diffM = Math.floor(diffD / 30.44);
  const diffY = Math.floor(diffD / 365.25);

  if (diffSec < 60) return "hace unos segundos";
  if (diffMin < 60) return diffMin === 1 ? "hace 1 minuto" : `hace ${diffMin} minutos`;
  if (diffH < 24) return diffH === 1 ? "hace 1 hora" : `hace ${diffH} horas`;
  if (diffD < 30) return diffD === 1 ? "hace 1 día" : `hace ${diffD} días`;
  if (diffM < 12) return diffM === 1 ? "hace 1 mes" : `hace ${diffM} meses`;
  return diffY === 1 ? "hace 1 año" : `hace ${diffY} años`;
}
