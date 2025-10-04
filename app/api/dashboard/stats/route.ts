import { NextResponse } from "next/server";
import { PrismaClient, MeterStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Función para calcular el estado global de medidores
function getOverallMeterStatus(statuses: MeterStatus[]): MeterStatus {
  if (statuses.includes(MeterStatus.FAULTY)) return MeterStatus.FAULTY;
  if (statuses.includes(MeterStatus.INACTIVE)) return MeterStatus.INACTIVE;
  if (statuses.includes(MeterStatus.MAINTENANCE))
    return MeterStatus.MAINTENANCE;
  if (statuses.every((s) => s === MeterStatus.ACTIVE))
    return MeterStatus.ACTIVE;
  return MeterStatus.ACTIVE; // fallback
}

export async function GET() {
  try {
    try {
      await prisma.$connect();
    } catch (connectionError) {
      return NextResponse.json(
        { error: "Database connection failed", details: connectionError },
        { status: 500 }
      );
    }

    // Obtener conteos totales uno por uno para identificar cuál falla
    let totalUsers = 0;
    let totalMeters = 0;
    let totalCooperatives = 0;
    let totalReadings = 0;

    try {
      totalUsers = await prisma.user.count();
    } catch {
      totalUsers = 0;
    }

    try {
      totalMeters = await prisma.meter.count();
    } catch {
      totalMeters = 0;
    }

    try {
      totalCooperatives = await prisma.cooperative.count();
    } catch {
      totalCooperatives = 0;
    }

    try {
      // Contar lecturas del mes actual
      const tz = "America/Argentina/Buenos_Aires";
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const toMidnight = (d: Date) => {
        const ymd = new Intl.DateTimeFormat("sv-SE", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
        return new Date(ymd + "T00:00:00Z");
      };

      const startMid = toMidnight(startOfMonth);
      const endMidExcl = toMidnight(endOfMonth);

      totalReadings = await prisma.reading.count({
        where: {
          timestamp: {
            gte: startMid,
            lt: endMidExcl,
          },
        },
      });
    } catch {
      totalReadings = 0;
    }

    // Obtener consumo total del mes actual
    let totalConsumption = 0;
    try {
      const tz = "America/Argentina/Buenos_Aires";
      const now = new Date();
      // Mes actual completo: del 1 al último día del mes
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Convertir a medianoche en timezone local
      const toMidnight = (d: Date) => {
        const ymd = new Intl.DateTimeFormat("sv-SE", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d);
        return new Date(ymd + "T00:00:00Z");
      };

      const startMid = toMidnight(startOfMonth);
      const endMidExcl = toMidnight(endOfMonth);

      const consumptionResult = await prisma.$queryRawUnsafe(
        `
        WITH base AS (
          SELECT
            meter_id,
            timezone($3, (timestamp AT TIME ZONE $3)) AS local_ts,
            cumulative_flow::text AS cf_raw,
            timestamp
          FROM "Reading"
          WHERE timezone($3, (timestamp AT TIME ZONE $3)) >= $1
            AND timezone($3, (timestamp AT TIME ZONE $3)) < $2
            AND cumulative_flow IS NOT NULL
            AND cumulative_flow <> ''
        ),
        norm AS (
          SELECT
            meter_id,
            local_ts,
            CAST(regexp_replace(cf_raw, '[^0-9\\.,-]', '', 'g') AS numeric) AS cf,
            timestamp
          FROM base
        ),
        daily_buckets AS (
          SELECT DISTINCT date_trunc('day', local_ts) AS bucket_local
          FROM norm
        ),
        daily_closures AS (
          SELECT
            n.meter_id,
            db.bucket_local,
            MAX(n.cf) AS cierre_dia,
            LAG(MAX(n.cf)) OVER (
              PARTITION BY n.meter_id 
              ORDER BY db.bucket_local
            ) AS cierre_dia_anterior
          FROM norm n
          JOIN daily_buckets db ON date_trunc('day', n.local_ts) = db.bucket_local
          GROUP BY n.meter_id, db.bucket_local
        ),
        consumo_por_medidor AS (
          SELECT
            meter_id,
            bucket_local,
            CASE 
              WHEN cierre_dia_anterior IS NULL THEN
                (SELECT GREATEST(MAX(cf) - MIN(cf), 0) 
                 FROM norm n2 
                 WHERE n2.meter_id = daily_closures.meter_id 
                 AND date_trunc('day', n2.local_ts) = daily_closures.bucket_local)
              ELSE
                GREATEST(cierre_dia - cierre_dia_anterior, 0)
            END AS consumo_diario
          FROM daily_closures
        )
        SELECT
          CAST(ROUND(SUM(consumo_diario)::numeric, 2) AS double precision) AS total_consumo
        FROM consumo_por_medidor;
      `,
        startMid,
        endMidExcl,
        tz
      );

      totalConsumption = Number(consumptionResult[0]?.total_consumo || 0);
    } catch (error) {
      totalConsumption = 0;
    }

    // Obtener medidores con problemas (incluyendo alertas de Status)
    let problematicMeters = 0;
    let totalAlerts = 0;
    try {
      // Medidores con problemas directos
      const directProblems = await prisma.meter.count({
        where: {
          OR: [
            { status: "FAULTY" },
            { operational_status: "NEEDS_MAINTENANCE" },
          ],
        },
      });

      // Medidores con alertas críticas en Status
      const criticalAlerts = await prisma.$queryRaw`
        SELECT COUNT(DISTINCT r.meter_id) as count
        FROM "Reading" r
        JOIN "Status" s ON s.reading_id = r.id
        WHERE (
          s.empty_pipe_alarm = true OR
          s.reverse_flow_alarm = true OR
          s.ee_alarm = true OR
          s.over_range_alarm = true OR
          s.water_temp_alarm = true OR
          s.valve_status = 'abnormal' OR
          (s.battery_status = false OR s.battery_voltage = 'low')
        )
        AND r.timestamp >= NOW() - INTERVAL '24 hours'
      `;

      // Medidores inactivos (sin lecturas en 24h)
      const inactiveMeters = await prisma.meter.count({
        where: {
          readings: {
            none: {
              timestamp: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
              },
            },
          },
        },
      });

      problematicMeters =
        directProblems + Number(criticalAlerts[0]?.count || 0) + inactiveMeters;
      totalAlerts = Number(criticalAlerts[0]?.count || 0) + inactiveMeters;
    } catch (error) {
      problematicMeters = 0;
      totalAlerts = 0;
    }

    // Obtener cooperativas activas
    let activeCooperatives = 0;
    try {
      activeCooperatives = await prisma.cooperative.count({
        where: {
          status: "ACTIVE",
        },
      });
    } catch {
      activeCooperatives = 0;
    }

    // Última lectura
    let lastReadingTimestamp = null;
    try {
      const lastReading = await prisma.reading.findFirst({
        orderBy: {
          timestamp: "desc",
        },
        select: {
          timestamp: true,
        },
      });
      lastReadingTimestamp = lastReading?.timestamp || null;
    } catch (error) {
      lastReadingTimestamp = null;
    }

    // Estados de medidores → overallStatus
    let overallMeterStatus: MeterStatus = MeterStatus.ACTIVE;
    try {
      const meters = await prisma.meter.findMany({
        select: { status: true },
      });

      overallMeterStatus = getOverallMeterStatus(meters.map((m) => m.status));
    } catch {
      overallMeterStatus = MeterStatus.ACTIVE;
    }

    // Armado de respuesta
    const userCounts = {
      total: totalUsers,
      active: totalUsers,
      inactive: 0,
      pending: 0,
      blocked: 0,
    };

    const meterCounts = {
      total: totalMeters,
      active: totalMeters - problematicMeters,
      inactive: 0,
      maintenance: 0,
      faulty: problematicMeters,
      overallStatus: overallMeterStatus, // 👈 agregado
    };

    const response = {
      users: userCounts,
      meters: meterCounts,
      cooperatives: {
        total: totalCooperatives,
        active: activeCooperatives,
        inactive: totalCooperatives - activeCooperatives,
      },
      readings: {
        total: totalReadings,
        recent: totalConsumption,
      },
      alerts: {
        problematicMeters,
        totalAlerts,
      },
      summary: {
        totalEntities: totalUsers + totalMeters + totalCooperatives,
        systemHealth:
          problematicMeters === 0
            ? "EXCELLENT"
            : problematicMeters < 5
            ? "GOOD"
            : "ATTENTION",
      },
      lastReadingTimestamp,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      // Error silencioso
    }
  }
}
