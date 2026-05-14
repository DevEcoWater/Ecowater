import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function configureDayjs() {
  dayjs.locale("es");
  dayjs.tz.setDefault("America/Argentina/Buenos_Aires");
}
