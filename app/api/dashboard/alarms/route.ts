import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { unstable_cache } from "next/cache";

const prisma = new PrismaClient();

function parseISODate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(d.getTime()) ? d : null;
}

function fmtDateTZ(d: Date, tz: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function toMidnight(d: Date, tz: string) {
  return new Date(fmtDateTZ(d, tz) + "T00:00:00Z");
}

function resolveRange(params: URLSearchParams, tz: string) {
  const now = new Date();
  const sd = parseISODate(params.get("startDate"));
  const ed = parseISODate(params.get("endDate"));

  if (sd && ed) {
    const diffDays = Math.round(
      (ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24)
    );
    return {
      startDate: toMidnight(sd, tz),
      endDate: addDays(toMidnight(ed, tz), 1),
      groupBy: diffDays > 31 ? "month" : "day",
    };
  }

  const periodMap: Record<string, Date> = {
    "7d": addDays(now, -7),
    "30d": addDays(now, -30),
    "90d": addDays(now, -90),
    "6m": addDays(now, -180),
    "1y": addDays(now, -365),
    month: new Date(now.getFullYear(), now.getMonth(), 1),
  };

  const period = params.get("period") || "30d";
  const start = periodMap[period] ?? periodMap["30d"];

  const groupByMap: Record<string, string> = {
    "7d": "day",
    "30d": "day",
    "90d": "month",
    "6m": "month",
    "1y": "month",
    month: "day",
  };

  return {
    startDate: toMidnight(start, tz),
    endDate: addDays(toMidnight(now, tz), 1),
    groupBy: groupByMap[period] ?? "day",
  };
}

// Cached: alarm aggregation SQL — 1-hour TTL per date range + groupBy
const getCachedAlarms = unstable_cache(
  async (
    startIso: string,
    endIso: string,
    groupBy: string
  ): Promise<Array<{
    fecha: string;
    flujo_inverso: number;
    tuberia_vacia: number;
    bateria_baja: number;
    alarma_temperatura: number;
    fuera_de_rango: number;
  }>> => {
    const tz = "America/Argentina/Buenos_Aires";
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        CASE
          WHEN $1 = 'month' THEN TO_CHAR(date_trunc('month', timezone($4, s.created_at)), 'YYYY-MM')
          ELSE TO_CHAR(timezone($4, s.created_at), 'YYYY-MM-DD')
        END AS fecha,
        COUNT(DISTINCT CASE WHEN s.reverse_flow_alarm THEN r.meter_id END)::int AS flujo_inverso,
        COUNT(DISTINCT CASE WHEN s.empty_pipe_alarm   THEN r.meter_id END)::int AS tuberia_vacia,
        COUNT(DISTINCT CASE WHEN s.battery_status     THEN r.meter_id END)::int AS bateria_baja,
        COUNT(DISTINCT CASE WHEN s.water_temp_alarm   THEN r.meter_id END)::int AS alarma_temperatura,
        COUNT(DISTINCT CASE WHEN s.over_range_alarm   THEN r.meter_id END)::int AS fuera_de_rango
      FROM "Status" s
      JOIN "Reading" r ON s.reading_id = r.id
      WHERE timezone($4, s.created_at) >= $2
        AND timezone($4, s.created_at) < $3
      GROUP BY fecha
      ORDER BY fecha ASC
      `,
      groupBy,
      startDate,
      endDate,
      tz
    );

    return (rows as any[]).map((r) => ({
      fecha: r.fecha,
      flujo_inverso: Number(r.flujo_inverso ?? 0),
      tuberia_vacia: Number(r.tuberia_vacia ?? 0),
      bateria_baja: Number(r.bateria_baja ?? 0),
      alarma_temperatura: Number(r.alarma_temperatura ?? 0),
      fuera_de_rango: Number(r.fuera_de_rango ?? 0),
    }));
  },
  ["dashboard-alarms"],
  { revalidate: 3600, tags: ["dashboard", "dashboard-alarms"] }
);

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const { startDate, endDate, groupBy } = resolveRange(searchParams, tz);

    const series = await getCachedAlarms(
      startDate.toISOString(),
      endDate.toISOString(),
      groupBy
    );

    return NextResponse.json({ series, groupBy });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch alarm trends" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
