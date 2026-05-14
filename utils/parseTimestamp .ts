import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

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

  // Interpreta como Argentina local y convierte a UTC ISO para que Prisma lo almacene correctamente.
  // Sin esto, el string sin zona se guardaba como UTC y al mostrar con UTC-3 aparecía 3h antes.
  return dayjs
    .tz(formattedInput, "America/Argentina/Buenos_Aires")
    .toISOString();
};

export const parseUnixTimeToArgentina = (unixTime: number): string => {
  const date = new Date(unixTime * 1000);
  return dayjs(date).tz("America/Argentina/Buenos_Aires").format();
};
