import { formatDateTimeAR } from "@/lib/utils";

type CsvRow = Record<string, string | number | null | undefined>;

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsvString(rows: CsvRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(",")),
  ];
  return lines.join("\n");
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadZoneCsv(
  zoneName: string,
  meters: Array<{
    id: string;
    dev_eui: string | null;
    userName: string | null;
    shortData: string | null;
    cumulative_flow: string | null;
    last_reading_value: string | null;
    last_reading_observations: string | null;
  }>
): void {
  const rows: CsvRow[] = meters.map((m) => ({
    "ID / DEV EUI": m.dev_eui ?? m.id,
    "Apellido y Nombre": m.userName ?? "",
    "Domicilio": m.shortData ?? "",
    "Consumo (m³)": m.last_reading_value ?? m.cumulative_flow ?? "",
    "Observaciones": m.last_reading_observations ?? "",
  }));
  const csv = toCsvString(rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `zona-${zoneName.toLowerCase().replace(/\s+/g, "-")}-${date}.csv`);
}

export async function downloadReadingsCsv(
  meterId: string,
  params: { period: string } | { startDate: string; endDate: string },
  filename?: string,
  meterInfo?: {
    devEui: string | null;
    userName: string | null;
    domicilio: string | null;
    meterType: string;
  }
): Promise<void> {
  const filterQuery =
    "period" in params
      ? `&period=${params.period}`
      : `&startDate=${params.startDate}&endDate=${params.endDate}`;
  const url = `/api/meter/${meterId}/readings?page=1&limit=9999${filterQuery}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al obtener las lecturas");

  const { data } = await response.json();
  const isMechanical = meterInfo?.meterType === "MECHANICAL";

  const rows: CsvRow[] = (data as any[]).map((r) => ({
    "ID / DEV EUI": meterInfo?.devEui ?? meterId,
    "Apellido y Nombre": meterInfo?.userName ?? "",
    "Domicilio": meterInfo?.domicilio ?? "",
    "Consumo (m³)": isMechanical
      ? (r.consumption ?? "")
      : (r.cumulative_flow ?? r.instantaneous_flow ?? ""),
    "Observaciones": r.observations ?? "",
  }));

  const csv = toCsvString(rows);
  const suffix = "period" in params ? params.period : `${params.startDate}_${params.endDate}`;
  downloadCsv(csv, filename ?? `lecturas-${meterId}-${suffix}.csv`);
}
