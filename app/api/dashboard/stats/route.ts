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
  return MeterStatus.ACTIVE;
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

    // Obtener conteos de medidores por status
    let activeMeters = 0;
    let inactiveMeters = 0;
    let maintenanceMeters = 0;
    let faultyMeters = 0;
    let totalAlerts = 0;
    let metersToDeactivate: any[] = [];
    let metersToActivate: any[] = [];

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 🔄 RETROALIMENTACIÓN INMEDIATA: Actualizar estados mientras calculamos

      // 1. Identificar medidores que deberían estar INACTIVE
      metersToDeactivate = await prisma.meter.findMany({
        where: {
          status: "ACTIVE",
          readings: {
            none: {
              timestamp: {
                gte: last24Hours,
              },
            },
          },
        },
        select: { id: true },
      });

      // 2. Identificar medidores que deberían estar ACTIVE
      metersToActivate = await prisma.meter.findMany({
        where: {
          status: "INACTIVE",
          readings: {
            some: {
              timestamp: {
                gte: last24Hours,
              },
            },
          },
        },
        select: { id: true },
      });

      // 3. Actualizar estados inmediatamente
      if (metersToDeactivate.length > 0) {
        await prisma.meter.updateMany({
          where: {
            id: { in: metersToDeactivate.map((m) => m.id) },
          },
          data: {
            status: "INACTIVE",
            updated_at: new Date(),
          },
        });
        console.log(
          `[STATS] Actualizados ${metersToDeactivate.length} medidores a INACTIVE`
        );
      }

      if (metersToActivate.length > 0) {
        await prisma.meter.updateMany({
          where: {
            id: { in: metersToActivate.map((m) => m.id) },
          },
          data: {
            status: "ACTIVE",
            updated_at: new Date(),
          },
        });
        console.log(
          `[STATS] Actualizados ${metersToActivate.length} medidores a ACTIVE`
        );
      }

      // 4. Ahora contar con estados actualizados
      activeMeters = await prisma.meter.count({
        where: {
          status: "ACTIVE",
          readings: {
            some: {
              timestamp: {
                gte: last24Hours,
              },
            },
          },
        },
      });

      inactiveMeters = await prisma.meter.count({
        where: {
          OR: [
            { status: "INACTIVE" },
            {
              status: "ACTIVE",
              readings: {
                none: {
                  timestamp: {
                    gte: last24Hours,
                  },
                },
              },
            },
          ],
        },
      });

      maintenanceMeters = await prisma.meter.count({
        where: { status: "MAINTENANCE" },
      });

      faultyMeters = await prisma.meter.count({
        where: { status: "FAULTY" },
      });

      // Para el dashboard, solo contamos medidores inactivos como alertas
      totalAlerts = inactiveMeters;
    } catch (error) {
      console.error("Error calculando estadísticas de medidores:", error);
      activeMeters = 0;
      inactiveMeters = 0;
      maintenanceMeters = 0;
      faultyMeters = 0;
      totalAlerts = 0;
      metersToDeactivate = [];
      metersToActivate = [];
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

    // 🎯 RESPUESTA OPTIMIZADA: Solo datos necesarios para dashboard
    const response = {
      // Datos esenciales para cards del dashboard
      meters: {
        total: totalMeters,
        active: activeMeters,
        inactive: inactiveMeters,
        maintenance: maintenanceMeters,
        faulty: faultyMeters,
        overallStatus: overallMeterStatus,
      },
      alerts: {
        totalAlerts,
        problematicMeters: faultyMeters + maintenanceMeters + inactiveMeters,
      },
      consumption: {
        total: totalConsumption, // m³ del mes actual
        readings: totalReadings, // total de lecturas del mes
      },
      systemHealth:
        faultyMeters === 0 && maintenanceMeters === 0 && inactiveMeters === 0
          ? "EXCELLENT"
          : faultyMeters === 0 && maintenanceMeters < 3 && inactiveMeters < 5
          ? "GOOD"
          : "ATTENTION",
      lastReadingTimestamp,
      // Metadatos para debugging
      meta: {
        timestamp: new Date().toISOString(),
        updatedMeters: {
          deactivated: metersToDeactivate.length,
          activated: metersToActivate.length,
        },
      },
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
