import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
    return { startDate: toMidnight(sd, tz), endDate: addDays(toMidnight(ed, tz), 1) };
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

  return { startDate: toMidnight(start, tz), endDate: addDays(toMidnight(now, tz), 1) };
}

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const { startDate, endDate } = resolveRange(searchParams, tz);

    const rows: Array<{
      meter_id: string;
      device_name: string;
      dev_eui: string;
      total_consumo: number;
    }> = await prisma.$queryRawUnsafe(
      `
      WITH base AS (
        SELECT meter_id,
          timezone($3, (timestamp AT TIME ZONE $3)) AS local_ts,
          cumulative_flow::text AS cf_raw
        FROM "Reading"
        WHERE timezone($3, (timestamp AT TIME ZONE $3)) >= $1
          AND timezone($3, (timestamp AT TIME ZONE $3)) < $2
          AND cumulative_flow IS NOT NULL
          AND cumulative_flow <> ''
      ),
      norm AS (
        SELECT meter_id, local_ts,
          CAST(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g') AS numeric) AS cf
        FROM base
      ),
      buckets AS (
        SELECT DISTINCT date_trunc('day', local_ts) AS bucket_local FROM norm
      ),
      closures AS (
        SELECT n.meter_id, b.bucket_local, MAX(n.cf) AS cierre,
          LAG(MAX(n.cf)) OVER (PARTITION BY n.meter_id ORDER BY b.bucket_local) AS cierre_prev
        FROM norm n
        JOIN buckets b ON date_trunc('day', n.local_ts) = b.bucket_local
        GROUP BY n.meter_id, b.bucket_local
      ),
      consumo_medidor AS (
        SELECT meter_id,
          CASE
            WHEN cierre_prev IS NULL THEN
              (SELECT GREATEST(MAX(cf) - MIN(cf), 0) FROM norm n2
               WHERE n2.meter_id = closures.meter_id
                 AND date_trunc('day', n2.local_ts) = closures.bucket_local)
            ELSE GREATEST(cierre - cierre_prev, 0)
          END AS consumo_diario
        FROM closures
      )
      SELECT cm.meter_id, m.device_name, m.dev_eui,
        CAST(ROUND(SUM(cm.consumo_diario)::numeric, 2) AS double precision) AS total_consumo
      FROM consumo_medidor cm
      JOIN "Meter" m ON m.id = cm.meter_id
      GROUP BY cm.meter_id, m.device_name, m.dev_eui
      ORDER BY total_consumo DESC;
      `,
      startDate,
      endDate,
      tz
    );

    const meters = rows.map((r) => ({
      meterId: r.meter_id,
      name: r.device_name || r.dev_eui,
      devEui: r.dev_eui,
      totalConsumo: Number(r.total_consumo ?? 0),
    }));

    return NextResponse.json({ meters });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch meter distribution" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
