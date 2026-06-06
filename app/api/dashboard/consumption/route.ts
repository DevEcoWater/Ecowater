import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type GroupBy = "day" | "month";

function parseISODate(s?: string | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(d.getTime()) ? d : null;
}

function normalizeGroupBy(s?: string | null): GroupBy {
  if (!s) return "day";
  const v = s.toLowerCase();
  return (["day", "month"] as GroupBy[]).includes(v as GroupBy)
    ? (v as GroupBy)
    : "day";
}

function fmtDateTZ(d: Date, tz: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function getTZOffsetMs(d: Date, tz: string): number {
  const fmt = (timeZone: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);

  return new Date(fmt(tz)).getTime() - new Date(fmt("UTC")).getTime();
}

function toMidnightTZ(ymd: string, tz: string): Date {
  const estimate = new Date(ymd + "T00:00:00Z");
  const offsetMs = getTZOffsetMs(estimate, tz);
  return new Date(estimate.getTime() - offsetMs);
}

function todayInTZ(tz: string): string {
  return fmtDateTZ(new Date(), tz);
}

function startOfMonthInTZ(tz: string): string {
  return todayInTZ(tz).substring(0, 7) + "-01";
}

function addDaysToYMD(ymd: string, n: number): string {
  const d = new Date(ymd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().substring(0, 10);
}

function resolveRange(
  params: URLSearchParams,
  tz: string
): {
  startDate: Date;
  endDate: Date;
  groupBy: GroupBy;
  fromExplicit: boolean;
  startOut: string;
  endOut: string;
} {
  const sd = parseISODate(params.get("startDate"));
  const ed = parseISODate(params.get("endDate"));
  let groupByParam = normalizeGroupBy(params.get("groupBy"));

  const todayYMD = todayInTZ(tz);

  if (sd && ed) {
    const startYMD = fmtDateTZ(sd, tz);
    const endYMD = fmtDateTZ(ed, tz);
    return {
      startDate: toMidnightTZ(startYMD, tz),
      endDate: toMidnightTZ(addDaysToYMD(endYMD, 1), tz),
      groupBy: groupByParam,
      fromExplicit: true,
      startOut: startYMD,
      endOut: endYMD,
    };
  }

  const periodMap: Record<string, { startYMD: string; groupBy: GroupBy }> = {
    "7d":    { startYMD: addDaysToYMD(todayYMD, -7),   groupBy: "day" },
    "30d":   { startYMD: addDaysToYMD(todayYMD, -30),  groupBy: "day" },
    "90d":   { startYMD: addDaysToYMD(todayYMD, -90),  groupBy: "month" },
    "6m":    { startYMD: addDaysToYMD(todayYMD, -180), groupBy: "month" },
    "1y":    { startYMD: addDaysToYMD(todayYMD, -365), groupBy: "month" },
    "month": { startYMD: startOfMonthInTZ(tz),         groupBy: "day" },
  };

  const period = params.get("period") || "30d";
  const config = periodMap[period] ?? periodMap["30d"];

  if (!params.get("groupBy")) groupByParam = config.groupBy;

  const endYMD = addDaysToYMD(todayYMD, 1);

  return {
    startDate: toMidnightTZ(config.startYMD, tz),
    endDate: toMidnightTZ(endYMD, tz),
    groupBy: groupByParam,
    fromExplicit: false,
    startOut: config.startYMD,
    endOut: todayYMD,
  };
}

const PREVIOUS_TOTAL_SQL = `
  WITH base AS (
    SELECT meter_id,
      timezone($4, (timestamp AT TIME ZONE $4)) AS local_ts,
      cumulative_flow::text AS cf_raw
    FROM "Reading"
    WHERE timezone($4, (timestamp AT TIME ZONE $4)) >= $2
      AND timezone($4, (timestamp AT TIME ZONE $4)) < $3
      AND cumulative_flow IS NOT NULL
      AND cumulative_flow <> ''
      AND ($5::text IS NULL OR meter_id = $5)
  ),
  norm AS (
    SELECT meter_id, local_ts,
      CAST(NULLIF(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g'), '') AS numeric) AS cf
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
  SELECT CAST(ROUND(SUM(consumo_diario)::numeric, 2) AS double precision) AS total_consumo
  FROM consumo_medidor;
`;

// Cached: all consumption query logic — 1-hour TTL per unique param combination
const getCachedConsumptionData = unstable_cache(
  async (
    startIso: string,
    endIso: string,
    groupBy: string,
    meterId: string,
    isMechanicalStr: string,
    compareStr: string
  ): Promise<{
    series: Array<{ fecha: string; consumo_m3: number; medidores_activos: number }>;
    previousTotal?: number;
  }> => {
    const tz = "America/Argentina/Buenos_Aires";
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    const isMechanicalMeter = isMechanicalStr === "true";
    const compare = compareStr === "true";
    const meterIdOrNull = meterId === "all" ? null : meterId;

    let rows: Array<{ fecha: string; consumo_m3: number; medidores_activos: number }>;

    if (isMechanicalMeter) {
      rows = await prisma.$queryRawUnsafe(
        `
        SELECT
          CASE
            WHEN $1 = 'month'
              THEN TO_CHAR(date_trunc($1, timezone($4, timestamp AT TIME ZONE $4)), 'YYYY-MM')
            ELSE TO_CHAR(date_trunc($1, timezone($4, timestamp AT TIME ZONE $4)), 'YYYY-MM-DD')
          END AS fecha,
          CAST(ROUND(COALESCE(SUM(GREATEST(consumption::numeric, 0)), 0)::numeric, 2) AS double precision) AS consumo_m3,
          COUNT(DISTINCT meter_id)::int AS medidores_activos
        FROM "Reading"
        WHERE timezone($4, (timestamp AT TIME ZONE $4)) >= $2
          AND timezone($4, (timestamp AT TIME ZONE $4)) < $3
          AND meter_id = $5
          AND consumption IS NOT NULL
        GROUP BY fecha,
          date_trunc($1, timezone($4, timestamp AT TIME ZONE $4))
        ORDER BY date_trunc($1, timezone($4, timestamp AT TIME ZONE $4));
        `,
        groupBy,
        startDate,
        endDate,
        tz,
        meterIdOrNull
      );
    } else if (!meterIdOrNull) {
      rows = await prisma.$queryRawUnsafe(
        `
        WITH smart_base AS (
          SELECT r.meter_id,
            timezone($4, (r.timestamp AT TIME ZONE $4)) AS local_ts,
            r.cumulative_flow::text AS cf_raw
          FROM "Reading" r
          JOIN "Meter" m ON r.meter_id = m.id
          WHERE timezone($4, (r.timestamp AT TIME ZONE $4)) >= $2
            AND timezone($4, (r.timestamp AT TIME ZONE $4)) < $3
            AND r.cumulative_flow IS NOT NULL AND r.cumulative_flow <> ''
            AND m.meter_type = 'SMART'
        ),
        norm AS (
          SELECT meter_id, local_ts,
            CAST(NULLIF(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g'), '') AS numeric) AS cf
          FROM smart_base
        ),
        buckets AS (SELECT DISTINCT date_trunc($1, local_ts) AS bucket_local FROM norm),
        closures AS (
          SELECT n.meter_id, b.bucket_local, MAX(n.cf) AS cierre,
            LAG(MAX(n.cf)) OVER (PARTITION BY n.meter_id ORDER BY b.bucket_local) AS cierre_prev
          FROM norm n JOIN buckets b ON date_trunc($1, n.local_ts) = b.bucket_local
          GROUP BY n.meter_id, b.bucket_local
        ),
        consumo_smart AS (
          SELECT meter_id, bucket_local,
            CASE WHEN cierre_prev IS NULL THEN
              (SELECT GREATEST(MAX(cf)-MIN(cf),0) FROM norm n2
               WHERE n2.meter_id=closures.meter_id AND date_trunc($1,n2.local_ts)=closures.bucket_local)
            ELSE GREATEST(cierre-cierre_prev,0) END AS consumo_diario
          FROM closures
        ),
        consumo_mech AS (
          SELECT r.meter_id,
            date_trunc($1, timezone($4, r.timestamp AT TIME ZONE $4)) AS bucket_local,
            GREATEST(r.consumption::numeric, 0) AS consumo_diario
          FROM "Reading" r
          JOIN "Meter" m ON r.meter_id = m.id
          WHERE timezone($4, (r.timestamp AT TIME ZONE $4)) >= $2
            AND timezone($4, (r.timestamp AT TIME ZONE $4)) < $3
            AND r.consumption IS NOT NULL
            AND m.meter_type = 'MECHANICAL'
        ),
        all_consumo AS (
          SELECT meter_id, bucket_local, consumo_diario FROM consumo_smart
          UNION ALL
          SELECT meter_id, bucket_local, consumo_diario FROM consumo_mech
        )
        SELECT
          CASE WHEN $1='month' THEN TO_CHAR(bucket_local,'YYYY-MM')
               ELSE TO_CHAR(bucket_local,'YYYY-MM-DD') END AS fecha,
          CAST(ROUND(SUM(consumo_diario)::numeric,2) AS double precision) AS consumo_m3,
          COUNT(DISTINCT meter_id)::int AS medidores_activos
        FROM all_consumo
        GROUP BY fecha, bucket_local
        ORDER BY bucket_local;
        `,
        groupBy,
        startDate,
        endDate,
        tz
      );
    } else {
      rows = await prisma.$queryRawUnsafe(
        `
        WITH base AS (
          SELECT
            meter_id,
            timezone($4, (timestamp AT TIME ZONE $4)) AS local_ts,
            cumulative_flow::text AS cf_raw,
            timestamp
          FROM "Reading"
          WHERE timezone($4, (timestamp AT TIME ZONE $4)) >= $2
            AND timezone($4, (timestamp AT TIME ZONE $4)) < $3
            AND cumulative_flow IS NOT NULL
            AND cumulative_flow <> ''
            AND meter_id = $5
        ),
        norm AS (
          SELECT
            meter_id,
            local_ts,
            CAST(NULLIF(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g'), '') AS numeric) AS cf,
            timestamp
          FROM base
        ),
        buckets AS (
          SELECT DISTINCT date_trunc($1, local_ts) AS bucket_local
          FROM norm
        ),
        closures AS (
          SELECT
            n.meter_id,
            b.bucket_local,
            MAX(n.cf) AS cierre,
            LAG(MAX(n.cf)) OVER (PARTITION BY n.meter_id ORDER BY b.bucket_local) AS cierre_prev
          FROM norm n
          JOIN buckets b ON date_trunc($1, n.local_ts) = b.bucket_local
          GROUP BY n.meter_id, b.bucket_local
        ),
        consumo_medidor AS (
          SELECT
            meter_id,
            bucket_local,
            CASE
              WHEN cierre_prev IS NULL THEN
                (SELECT GREATEST(MAX(cf) - MIN(cf), 0)
                 FROM norm n2
                 WHERE n2.meter_id = closures.meter_id
                   AND date_trunc($1, n2.local_ts) = closures.bucket_local)
              ELSE GREATEST(cierre - cierre_prev, 0)
            END AS consumo_diario
          FROM closures
        )
        SELECT
          CASE
            WHEN $1 = 'month' THEN TO_CHAR(bucket_local, 'YYYY-MM')
            ELSE TO_CHAR(bucket_local, 'YYYY-MM-DD')
          END AS fecha,
          CAST(ROUND(SUM(consumo_diario)::numeric, 2) AS double precision) AS consumo_m3,
          COUNT(DISTINCT meter_id)::int AS medidores_activos
        FROM consumo_medidor
        GROUP BY fecha, bucket_local
        ORDER BY bucket_local;
        `,
        groupBy,
        startDate,
        endDate,
        tz,
        meterIdOrNull
      );
    }

    const series = (rows as any[]).map((r) => ({
      fecha: r.fecha,
      consumo_m3: Number(r.consumo_m3 ?? 0),
      medidores_activos: Number(r.medidores_activos ?? 0),
    }));

    let previousTotal: number | undefined;
    if (compare) {
      const durationMs = endDate.getTime() - startDate.getTime();
      const prevEnd = startDate;
      const prevStart = new Date(startDate.getTime() - durationMs);

      let prevRows: Array<{ total_consumo: number }>;
      if (isMechanicalMeter) {
        prevRows = await prisma.$queryRawUnsafe(
          `SELECT CAST(ROUND(COALESCE(SUM(GREATEST(consumption::numeric, 0)), 0)::numeric, 2) AS double precision) AS total_consumo
           FROM "Reading"
           WHERE timezone($3, (timestamp AT TIME ZONE $3)) >= $1
             AND timezone($3, (timestamp AT TIME ZONE $3)) < $2
             AND meter_id = $4
             AND consumption IS NOT NULL`,
          prevStart,
          prevEnd,
          tz,
          meterIdOrNull
        );
      } else if (!meterIdOrNull) {
        prevRows = await prisma.$queryRawUnsafe(
          `
          WITH smart_base AS (
            SELECT r.meter_id, timezone($3,(r.timestamp AT TIME ZONE $3)) AS local_ts, r.cumulative_flow::text AS cf_raw
            FROM "Reading" r JOIN "Meter" m ON r.meter_id = m.id
            WHERE timezone($3,(r.timestamp AT TIME ZONE $3)) >= $1
              AND timezone($3,(r.timestamp AT TIME ZONE $3)) < $2
              AND r.cumulative_flow IS NOT NULL AND r.cumulative_flow <> ''
              AND m.meter_type = 'SMART'
          ),
          norm AS (SELECT meter_id, local_ts, CAST(regexp_replace(cf_raw,'[^0-9\\.,-]','','g') AS numeric) AS cf FROM smart_base),
          buckets AS (SELECT DISTINCT date_trunc('day', local_ts) AS bucket_local FROM norm),
          closures AS (
            SELECT n.meter_id, b.bucket_local, MAX(n.cf) AS cierre,
              LAG(MAX(n.cf)) OVER (PARTITION BY n.meter_id ORDER BY b.bucket_local) AS cierre_prev
            FROM norm n JOIN buckets b ON date_trunc('day',n.local_ts)=b.bucket_local
            GROUP BY n.meter_id, b.bucket_local
          ),
          consumo_smart AS (
            SELECT CASE WHEN cierre_prev IS NULL THEN
              (SELECT GREATEST(MAX(cf)-MIN(cf),0) FROM norm n2 WHERE n2.meter_id=closures.meter_id AND date_trunc('day',n2.local_ts)=closures.bucket_local)
            ELSE GREATEST(cierre-cierre_prev,0) END AS consumo_diario FROM closures
          ),
          consumo_mech AS (
            SELECT GREATEST(r.consumption::numeric,0) AS consumo_diario
            FROM "Reading" r JOIN "Meter" m ON r.meter_id = m.id
            WHERE timezone($3,(r.timestamp AT TIME ZONE $3)) >= $1
              AND timezone($3,(r.timestamp AT TIME ZONE $3)) < $2
              AND r.consumption IS NOT NULL AND m.meter_type = 'MECHANICAL'
          )
          SELECT CAST(ROUND(SUM(consumo_diario)::numeric,2) AS double precision) AS total_consumo
          FROM (SELECT consumo_diario FROM consumo_smart UNION ALL SELECT consumo_diario FROM consumo_mech) combined;
          `,
          prevStart,
          prevEnd,
          tz
        );
      } else {
        prevRows = await prisma.$queryRawUnsafe(
          PREVIOUS_TOTAL_SQL,
          "day",
          prevStart,
          prevEnd,
          tz,
          meterIdOrNull
        );
      }
      previousTotal = Number((prevRows as any[])[0]?.total_consumo ?? 0);
    }

    return { series, ...(compare && { previousTotal }) };
  },
  ["dashboard-consumption"],
  { revalidate: 3600, tags: ["dashboard", "dashboard-consumption"] }
);

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const meterId = searchParams.get("meterId") || null;
    const compare = searchParams.get("compare") === "true";

    const { startDate, endDate, groupBy, fromExplicit, startOut, endOut } =
      resolveRange(searchParams, tz);

    let isMechanicalMeter = false;
    if (meterId) {
      const meter = await prisma.meter.findUnique({
        where: { id: meterId },
        select: { meter_type: true },
      });
      isMechanicalMeter = meter?.meter_type === "MECHANICAL";
    }

    const { series, previousTotal } = await getCachedConsumptionData(
      startDate.toISOString(),
      endDate.toISOString(),
      groupBy,
      meterId ?? "all",
      isMechanicalMeter ? "true" : "false",
      compare ? "true" : "false"
    );

    return NextResponse.json({
      meterId: meterId || "all",
      startDate: startOut,
      endDate: endOut,
      period: fromExplicit ? undefined : searchParams.get("period") || "30d",
      groupBy,
      series,
      ...(compare && { previousTotal }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch consumption data", detail: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
