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
    dev_eui: string;
    device_name: string;
    userName: string | null;
    shortData: string | null;
    cumulative_flow: string | null;
    status: string;
  }>
): void {
  const rows: CsvRow[] = meters.map((m) => ({
    "DEV EUI": m.dev_eui,
    "Nombre del dispositivo": m.device_name,
    "Usuario": m.userName ?? "",
    "Dirección": m.shortData ?? "",
    "Flujo Acumulado (m³)": m.cumulative_flow ?? "",
    "Estado": m.status,
  }));
  const csv = toCsvString(rows);
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(csv, `zona-${zoneName.toLowerCase().replace(/\s+/g, "-")}-${date}.csv`);
}

export async function downloadReadingsCsv(
  meterId: string,
  params: { period: string } | { startDate: string; endDate: string },
  filename?: string
): Promise<void> {
  const filterQuery =
    "period" in params
      ? `&period=${params.period}`
      : `&startDate=${params.startDate}&endDate=${params.endDate}`;
  const url = `/api/meter/${meterId}/readings?page=1&limit=9999${filterQuery}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Error al obtener las lecturas");

  const { data } = await response.json();

  const rows: CsvRow[] = (data as any[]).map((r) => ({
    "Fecha y Hora": new Date(r.timestamp).toLocaleString("es-ES", { timeZone: "UTC" }),
    "Flujo Acumulado (m³)": r.cumulative_flow ?? "",
    "Flujo Instantáneo (m³)": r.instantaneous_flow ?? "",
    "Flujo Reverso (m³)": r.reverse_flow ?? "",
    "Temperatura (°C)": r.real_time_temperature ?? "",
    "Estado": r.statuses?.meter_status ?? "",
    "Válvula": r.statuses?.valve_status ?? "",
    "Batería": r.statuses?.battery_voltage ?? "",
  }));

  const csv = toCsvString(rows);
  const suffix = "period" in params ? params.period : `${params.startDate}_${params.endDate}`;
  downloadCsv(csv, filename ?? `lecturas-${meterId}-${suffix}.csv`);
}
