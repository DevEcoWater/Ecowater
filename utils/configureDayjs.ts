import dayjs from "dayjs";
// Side-effect locale import — update this import when changing clientConfig.locale.lang
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { clientConfig } from "@/config/client.config";

dayjs.extend(utc);
dayjs.extend(timezone);

export function configureDayjs() {
  dayjs.locale(clientConfig.locale.lang);
  dayjs.tz.setDefault(clientConfig.locale.timezone);
}
