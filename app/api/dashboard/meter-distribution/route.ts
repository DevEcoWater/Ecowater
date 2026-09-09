import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

// Cached: heavy aggregation SQL — 1-hour TTL per date range
const getCachedDistribution = unstable_cache(
  async (
    startIso: string,
    endIso: string
  ): Promise<Array<{ meterId: string; name: string; devEui: string; totalConsumo: number }>> => {
    const tz = "America/Argentina/Buenos_Aires";
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    const rows: Array<{
      meter_id: string;
      device_name: string;
      dev_eui: string;
      total_consumo: number;
    }> = await prisma.$queryRawUnsafe(
      `
      WITH smart_base AS (
        SELECT r.meter_id,
          timezone($3, (r.timestamp AT TIME ZONE $3)) AS local_ts,
          r.cumulative_flow::text AS cf_raw
        FROM "Reading" r
        JOIN "Meter" m ON r.meter_id = m.id
        WHERE timezone($3, (r.timestamp AT TIME ZONE $3)) >= $1
          AND timezone($3, (r.timestamp AT TIME ZONE $3)) < $2
          AND r.cumulative_flow IS NOT NULL
          AND r.cumulative_flow <> ''
          AND m.meter_type = 'SMART'
      ),
      norm AS (
        SELECT meter_id, local_ts,
          CAST(NULLIF(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g'), '') AS numeric) AS cf
        FROM smart_base
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
      consumo_smart AS (
        SELECT meter_id,
          CASE
            WHEN cierre_prev IS NULL THEN
              (SELECT GREATEST(MAX(cf) - MIN(cf), 0) FROM norm n2
               WHERE n2.meter_id = closures.meter_id
                 AND date_trunc('day', n2.local_ts) = closures.bucket_local)
            ELSE GREATEST(cierre - cierre_prev, 0)
          END AS consumo_diario
        FROM closures
      ),
      consumo_mech AS (
        SELECT r.meter_id, GREATEST(r.consumption::numeric, 0) AS consumo_diario
        FROM "Reading" r
        JOIN "Meter" m ON r.meter_id = m.id
        WHERE timezone($3, (r.timestamp AT TIME ZONE $3)) >= $1
          AND timezone($3, (r.timestamp AT TIME ZONE $3)) < $2
          AND r.consumption IS NOT NULL
          AND m.meter_type = 'MECHANICAL'
      ),
      all_consumo AS (
        SELECT meter_id, consumo_diario FROM consumo_smart
        UNION ALL
        SELECT meter_id, consumo_diario FROM consumo_mech
      )
      SELECT ac.meter_id, m.device_name, m.dev_eui,
        CAST(ROUND(SUM(ac.consumo_diario)::numeric, 2) AS double precision) AS total_consumo
      FROM all_consumo ac
      JOIN "Meter" m ON m.id = ac.meter_id
      GROUP BY ac.meter_id, m.device_name, m.dev_eui
      ORDER BY total_consumo DESC;
      `,
      startDate,
      endDate,
      tz
    );

    return (rows as any[]).map((r) => ({
      meterId: r.meter_id,
      name: r.device_name || r.dev_eui,
      devEui: r.dev_eui,
      totalConsumo: Number(r.total_consumo ?? 0),
    }));
  },
  ["dashboard-distribution"],
  { revalidate: 3600, tags: ["dashboard", "dashboard-distribution"] }
);

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const { startDate, endDate } = resolveRange(searchParams, tz);

    const meters = await getCachedDistribution(
      startDate.toISOString(),
      endDate.toISOString()
    );

    return NextResponse.json({ meters });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch meter distribution", detail: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
