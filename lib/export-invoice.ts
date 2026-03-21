import { toCsvString, downloadCsv } from "@/lib/export-csv";
import dayjs from "dayjs";

export interface InvoiceParams {
  meterId: string;
  devEui: string;
  cumulativeFlow: number | null | undefined;
  userId: string | null | undefined;
  /** "YYYY/MM" — por defecto el mes actual */
  period?: string;
  filename?: string;
}

async function fetchUserData(
  userId: string
): Promise<{ name: string; address: string } | null> {
  try {
    const res = await fetch(`/api/user/${userId}`);
    if (!res.ok) return null;
    const user = await res.json();
    const name = `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim();
    const address = user.address?.shortData ?? user.address?.data ?? "";
    return { name, address };
  } catch {
    return null;
  }
}

async function fetchCooperativeName(): Promise<string> {
  try {
    const res = await fetch("/api/cooperative");
    if (!res.ok) return "";
    const coop = await res.json();
    return coop.name ?? "";
  } catch {
    return "";
  }
}

/**
 * Calcula el consumo del período obteniendo la primera y última lectura
 * dentro del mes indicado y devolviendo la diferencia de flujo acumulado.
 */
async function fetchPeriodConsumption(
  meterId: string,
  period: string
): Promise<number | null> {
  try {
    // period = "YYYY/MM"
    const [year, month] = period.split("/").map(Number);
    const startDate = dayjs(new Date(year, month - 1, 1)).format("YYYY-MM-DD");
    const endDate = dayjs(new Date(year, month, 0)).format("YYYY-MM-DD");

    const res = await fetch(
      `/api/meter/${meterId}/readings?page=1&limit=9999&startDate=${startDate}&endDate=${endDate}`
    );
    if (!res.ok) return null;

    const { data } = await res.json();
    if (!data || data.length === 0) return null;

    const sorted = [...data].sort(
      (a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const first = sorted[0]?.cumulative_flow ?? null;
    const last = sorted[sorted.length - 1]?.cumulative_flow ?? null;

    if (first == null || last == null) return null;
    return Math.max(0, last - first);
  } catch {
    return null;
  }
}

export async function downloadInvoiceCsv(params: InvoiceParams): Promise<void> {
  const {
    meterId,
    devEui,
    cumulativeFlow,
    userId,
    filename,
  } = params;

  const period = params.period ?? dayjs().format("YYYY/MM");

  const [userData, cooperativeName, periodConsumption] = await Promise.all([
    userId ? fetchUserData(userId) : Promise.resolve(null),
    fetchCooperativeName(),
    fetchPeriodConsumption(meterId, period),
  ]);

  const row = {
    Organización: cooperativeName,
    Fecha: dayjs().format("DD/MM/YYYY"),
    "N° Medidor (DEV_EUI)": devEui,
    Período: period,
    "Apellido y Nombre": userData?.name ?? "",
    "Dom. Conexión": userData?.address ?? "",
    "Flujo Acumulado (m³)": cumulativeFlow ?? "",
    "Consumo del Período (m³)": periodConsumption ?? "",
  };

  const csv = toCsvString([row]);
  const safePeriod = period.replace("/", "-");
  downloadCsv(
    csv,
    filename ?? `factura-${devEui}-${safePeriod}.csv`
  );
}
