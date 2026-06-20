import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { clientConfig } from "@/config/client.config";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a Unix timestamp (in seconds) to the client's configured timezone.
 * @param timestamp - Unix timestamp in seconds
 * @returns ISO string in the client timezone (from clientConfig.locale.timezone)
 */
export const convertTimestampToLocalTime = (timestamp: number): string => {
  return dayjs(timestamp * 1000)
    .tz(clientConfig.locale.timezone)
    .format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};

/** @deprecated Use convertTimestampToLocalTime instead */
export const convertTimestampToArgentinaTime = convertTimestampToLocalTime;

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
