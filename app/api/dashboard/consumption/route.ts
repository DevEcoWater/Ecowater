import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

/** Devuelve YYYY-MM-DD en TZ dada */
function fmtDateTZ(d: Date, tz: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Resuelve rango y agrupación */
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
  const now = new Date();
  const sd = parseISODate(params.get("startDate"));
  const ed = parseISODate(params.get("endDate"));
  let groupByParam = normalizeGroupBy(params.get("groupBy"));

  const toMidnight = (d: Date) => {
    const ymd = fmtDateTZ(d, tz);
    return new Date(ymd + "T00:00:00Z");
  };

  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + n);
    return x;
  };

  // Mapeo period -> duración y groupBy
  const periodMap: Record<string, { start: Date; groupBy: GroupBy }> = {
    "7d": { start: addDays(now, -7), groupBy: "day" },
    "30d": { start: addDays(now, -30), groupBy: "day" },
    "90d": { start: addDays(now, -90), groupBy: "month" },
    "1y": { start: new Date(now.getFullYear(), 0, 1), groupBy: "month" },
    month: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      groupBy: "month",
    },
  };

  // Caso fechas explícitas
  if (sd && ed) {
    const startMid = toMidnight(sd);
    const endMidExcl = addDays(toMidnight(ed), 1);
    return {
      startDate: startMid,
      endDate: endMidExcl,
      groupBy: groupByParam,
      fromExplicit: true,
      startOut: fmtDateTZ(sd, tz),
      endOut: fmtDateTZ(ed, tz),
    };
  }

  // Caso default → usamos period
  const period = params.get("period") || "7d";
  const periodConfig = periodMap[period] ?? periodMap["7d"];
  const start = periodConfig.start;
  const end =
    period === "month"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 1)
      : now;

  if (!params.get("groupBy")) groupByParam = periodConfig.groupBy;

  const startMid = toMidnight(start);
  const endMidExcl = addDays(toMidnight(end), 1);

  return {
    startDate: startMid,
    endDate: endMidExcl,
    groupBy: groupByParam,
    fromExplicit: false,
    startOut: fmtDateTZ(start, tz),
    endOut: fmtDateTZ(end, tz),
  };
}

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const meterId = searchParams.get("meterId") || null;

    const { startDate, endDate, groupBy, fromExplicit, startOut, endOut } =
      resolveRange(searchParams, tz);

    const rows: Array<{
      fecha: string;
      consumo_m3: number;
      medidores_activos: number;
    }> = await prisma.$queryRawUnsafe(
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
          AND ($5::text IS NULL OR meter_id = $5)
      ),
      norm AS (
        SELECT
          meter_id,
          local_ts,
          CAST(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g') AS numeric) AS cf,
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
      groupBy, // $1
      startDate, // $2
      endDate, // $3
      tz, // $4
      meterId ?? null // $5
    );

    const series = rows.map((r) => ({
      fecha: r.fecha,
      consumo_m3: Number(r.consumo_m3 ?? 0),
      medidores_activos: Number(r.medidores_activos ?? 0),
    }));

    return NextResponse.json({
      meterId: meterId || "all",
      startDate: startOut,
      endDate: endOut,
      period: fromExplicit ? undefined : searchParams.get("period") || "7d",
      groupBy,
      series,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch consumption data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
