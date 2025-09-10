import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type GroupBy = "day" | "week" | "month";

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
  return (["day", "week", "month"] as GroupBy[]).includes(v as GroupBy)
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
  }).format(d); // "YYYY-MM-DD"
}

/** Resuelve rango y lo alinea a medianoches AR (start incl., end excl.) */
function resolveRange(
  params: URLSearchParams,
  tz: string
): {
  startDate: Date; // 00:00 AR
  endDate: Date; // 00:00 AR día siguiente (excl.)
  groupBy: GroupBy;
  fromExplicit: boolean;
  startOut: string; // para devolver en JSON
  endOut: string; // para devolver en JSON
} {
  const sd = parseISODate(params.get("startDate"));
  const ed = parseISODate(params.get("endDate"));
  const groupByParam = normalizeGroupBy(params.get("groupBy"));

  const toMidnight = (d: Date) => {
    const ymd = fmtDateTZ(d, tz); // "YYYY-MM-DD" en AR
    return new Date(ymd + "T00:00:00Z"); // usaremos 'AT TIME ZONE' en SQL
  };
  const addDays = (d: Date, n: number) => {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + n);
    return x;
  };

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

  // Para dashboard: siempre mes actual completo
  const now = new Date();
  const period = params.get("period") || "month";
  let groupBy: GroupBy = "day";

  // Mes actual completo: del 1 al último día del mes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startMid = toMidnight(startOfMonth); // 00:00 AR del 1 del mes
  const endMidExcl = toMidnight(endOfMonth); // 00:00 AR del 1 del mes siguiente

  return {
    startDate: startMid,
    endDate: endMidExcl,
    groupBy,
    fromExplicit: false,
    startOut: fmtDateTZ(startOfMonth, tz),
    endOut: fmtDateTZ(endOfMonth, tz),
  };
}

export async function GET(req: Request) {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    const { searchParams } = new URL(req.url);
    const meterId = searchParams.get("meterId") || null;

    const { startDate, endDate, groupBy, fromExplicit, startOut, endOut } =
      resolveRange(searchParams, tz);

    // 🔍 DEBUGGING TEMPORAL
    console.log("🔍 === CONSUMPTION API DEBUG ===");
    console.log(
      `📅 Rango: ${startDate.toISOString()} a ${endDate.toISOString()}`
    );
    console.log(`🌍 Timezone: ${tz}`);
    console.log(`📊 GroupBy: ${groupBy}`);
    console.log(`🔧 MeterId: ${meterId || "ALL"}`);

    const rows: Array<{
      fecha: string;
      consumo_m3: number;
      medidores_activos: number;
    }> = await prisma.$queryRawUnsafe(
      `WITH base AS (
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
-- Método preferido: Cierres de período
daily_buckets AS (
  SELECT DISTINCT date_trunc($1, local_ts) AS bucket_local
  FROM norm
),
-- Para cada medidor y bucket, obtener el cierre del día
daily_closures AS (
  SELECT
    n.meter_id,
    db.bucket_local,
    -- Último totalizador <= 24:00 del día (cierre del día)
    MAX(n.cf) AS cierre_dia,
    -- Último totalizador <= 24:00 del día anterior
    LAG(MAX(n.cf)) OVER (
      PARTITION BY n.meter_id 
      ORDER BY db.bucket_local
    ) AS cierre_dia_anterior
  FROM norm n
  JOIN daily_buckets db ON date_trunc($1, n.local_ts) = db.bucket_local
  GROUP BY n.meter_id, db.bucket_local
),
-- Calcular consumo diario por medidor
consumo_por_medidor AS (
  SELECT
    meter_id,
    bucket_local,
    CASE 
      WHEN cierre_dia_anterior IS NULL THEN
        -- Fallback: max - min dentro del día
        (SELECT GREATEST(MAX(cf) - MIN(cf), 0) 
         FROM norm n2 
         WHERE n2.meter_id = daily_closures.meter_id 
         AND date_trunc($1, n2.local_ts) = daily_closures.bucket_local)
      ELSE
        -- Método preferido: cierre_día - cierre_día_anterior
        GREATEST(cierre_dia - cierre_dia_anterior, 0)
    END AS consumo_diario
  FROM daily_closures
)
SELECT
  to_char(
    bucket_local,
    CASE
      WHEN $1 = 'month' THEN 'YYYY-MM'
      WHEN $1 = 'week'  THEN 'IYYY-IW'
      ELSE 'YYYY-MM-DD'
    END
  ) AS fecha,
  CAST(ROUND(SUM(consumo_diario)::numeric, 2) AS double precision) AS consumo_m3,
  COUNT(DISTINCT meter_id)::int AS medidores_activos
FROM consumo_por_medidor
GROUP BY bucket_local
ORDER BY bucket_local;
        `,
      groupBy, // $1
      startDate, // $2: 00:00 AR del inicio (incl.)
      endDate, // $3: 00:00 AR día siguiente (excl.)
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
    console.error("Consumption API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch consumption data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
