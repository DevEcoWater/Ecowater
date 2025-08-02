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
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
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
    .format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
};

/**
 * Converts a Unix timestamp (in seconds) to UTC ISO string
 * @param timestamp - Unix timestamp in seconds
 * @returns ISO string in UTC
 */
export const convertTimestampToUTC = (timestamp: number): string => {
  return dayjs(timestamp * 1000).toISOString();
};
