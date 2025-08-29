import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
export const parseTimestamp = (timestamp: string): string => {
  if (timestamp.length < 12) {
    throw new Error(
      "Invalid timestamp format. Expected at least 12 characters."
    );
  }

  const ss = timestamp.slice(0, 2);
  const mm = timestamp.slice(2, 4);
  const HH = timestamp.slice(4, 6);
  const dd = timestamp.slice(6, 8);
  const MM = timestamp.slice(8, 10);
  const yy = timestamp.slice(10, 12);

  const fullYear = 2000 + parseInt(yy);

  const formattedInput = `${fullYear}-${MM}-${dd} ${HH}:${mm}:${ss}`;
  const argentinaTime = dayjs
    .utc(formattedInput)
    .tz("America/Argentina/Buenos_Aires")
    .format("DD/MM/YYYY HH:mm:ss");

  return argentinaTime.toString();
};

export const parseUnixTimeToArgentina = (unixTime: number): string => {
  const date = new Date(unixTime * 1000);
  return dayjs(date).tz("America/Argentina/Buenos_Aires").toISOString();
};
