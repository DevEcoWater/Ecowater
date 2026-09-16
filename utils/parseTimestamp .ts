import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { clientConfig } from "@/config/client.config";

dayjs.extend(utc);
dayjs.extend(timezone);

export const parseTimestamp = (timestamp: string): string => {
  if (timestamp.length < 14) {
    throw new Error(
      "Invalid timestamp format. Expected at least 14 characters.",
    );
  }

  const ss = timestamp.slice(0, 2);
  const mm = timestamp.slice(2, 4);
  const HH = timestamp.slice(4, 6);
  const dd = timestamp.slice(6, 8);
  const MM = timestamp.slice(8, 10);
  const yy = timestamp.slice(10, 12);
  const century = timestamp.slice(12, 14);

  const fullYear = parseInt(century + yy, 10);

  const formattedInput = `${fullYear}-${MM}-${dd} ${HH}:${mm}:${ss}`;

  // El reloj del medidor emite en UTC, no en hora local. Interpretar estos
  // dígitos como timezone local (como se hizo entre e9fe1b9 y este fix)
  // corría cada instante +3h hacia el futuro real — ver ED-90.
  return dayjs.utc(formattedInput).toISOString();
};

export const parseUnixTimeToLocal = (unixTime: number): string => {
  const date = new Date(unixTime * 1000);
  return dayjs(date).tz(clientConfig.locale.timezone).format();
};

/** @deprecated Use parseUnixTimeToLocal instead */
export const parseUnixTimeToArgentina = parseUnixTimeToLocal;
