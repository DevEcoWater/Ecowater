import { NextResponse } from "next/server";
import { PrismaClient, MeterStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function getOverallMeterStatus(statuses: MeterStatus[]): MeterStatus {
  if (statuses.includes(MeterStatus.FAULTY)) return MeterStatus.FAULTY;
  if (statuses.includes(MeterStatus.INACTIVE)) return MeterStatus.INACTIVE;
  if (statuses.includes(MeterStatus.MAINTENANCE)) return MeterStatus.MAINTENANCE;
  if (statuses.every((s) => s === MeterStatus.ACTIVE)) return MeterStatus.ACTIVE;
  return MeterStatus.ACTIVE;
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

function getMonthRangeTZ(tz: string): { startMid: Date; endMidExcl: Date } {
  const todayYMD = fmtDateTZ(new Date(), tz);
  const startOfMonthYMD = todayYMD.substring(0, 7) + "-01";
  const nextMonth = new Date(startOfMonthYMD + "T00:00:00Z");
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const endOfMonthYMD = nextMonth.toISOString().substring(0, 10);
  return {
    startMid: toMidnightTZ(startOfMonthYMD, tz),
    endMidExcl: toMidnightTZ(endOfMonthYMD, tz),
  };
}

export async function GET() {
  const tz = "America/Argentina/Buenos_Aires";

  try {
    try {
      await prisma.$connect();
    } catch (connectionError) {
      return NextResponse.json(
        { error: "Database connection failed", details: connectionError },
        { status: 500 }
      );
    }

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
      const { startMid, endMidExcl } = getMonthRangeTZ(tz);

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

    let totalConsumption = 0;
    try {
      const { startMid, endMidExcl } = getMonthRangeTZ(tz);

      const consumptionResult = await prisma.$queryRawUnsafe(
        `
        WITH base AS (
          SELECT
            r.meter_id,
            timezone($3, (r.timestamp AT TIME ZONE $3)) AS local_ts,
            r.cumulative_flow::text AS cf_raw,
            r.timestamp
          FROM "Reading" r
          JOIN "Meter" m ON r.meter_id = m.id
          WHERE timezone($3, (r.timestamp AT TIME ZONE $3)) >= $1
            AND timezone($3, (r.timestamp AT TIME ZONE $3)) < $2
            AND r.cumulative_flow IS NOT NULL
            AND r.cumulative_flow <> ''
            AND m.meter_type = 'SMART'
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
        ),
        consumo_mech AS (
          SELECT r.meter_id, GREATEST(r.consumption::numeric, 0) AS consumo_diario
          FROM "Reading" r
          JOIN "Meter" m ON r.meter_id = m.id
          WHERE timezone($3, (r.timestamp AT TIME ZONE $3)) >= $1
            AND timezone($3, (r.timestamp AT TIME ZONE $3)) < $2
            AND r.consumption IS NOT NULL
            AND m.meter_type = 'MECHANICAL'
        )
        SELECT
          CAST(ROUND(SUM(consumo_diario)::numeric, 2) AS double precision) AS total_consumo
        FROM (
          SELECT consumo_diario FROM consumo_por_medidor
          UNION ALL
          SELECT consumo_diario FROM consumo_mech
        ) combined;
        `,
        startMid,
        endMidExcl,
        tz
      );

      totalConsumption = Number(consumptionResult[0]?.total_consumo || 0);
    } catch (error) {
      totalConsumption = 0;
    }

    let activeMeters = 0;
    let inactiveMeters = 0;
    let maintenanceMeters = 0;
    let faultyMeters = 0;
    let totalAlerts = 0;
    let metersToDeactivate: any[] = [];
    let metersToActivate: any[] = [];

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      metersToDeactivate = await prisma.meter.findMany({
        where: {
          status: "ACTIVE",
          readings: {
            none: {
              timestamp: { gte: last24Hours },
            },
          },
        },
        select: { id: true },
      });

      metersToActivate = await prisma.meter.findMany({
        where: {
          status: "INACTIVE",
          readings: {
            some: {
              timestamp: { gte: last24Hours },
            },
          },
        },
        select: { id: true },
      });

      if (metersToDeactivate.length > 0) {
        await prisma.meter.updateMany({
          where: { id: { in: metersToDeactivate.map((m) => m.id) } },
          data: { status: "INACTIVE", updated_at: new Date() },
        });
        console.log(`[STATS] Actualizados ${metersToDeactivate.length} medidores a INACTIVE`);
      }

      if (metersToActivate.length > 0) {
        await prisma.meter.updateMany({
          where: { id: { in: metersToActivate.map((m) => m.id) } },
          data: { status: "ACTIVE", updated_at: new Date() },
        });
        console.log(`[STATS] Actualizados ${metersToActivate.length} medidores a ACTIVE`);
      }

      activeMeters = await prisma.meter.count({
        where: {
          status: "ACTIVE",
          readings: {
            some: { timestamp: { gte: last24Hours } },
          },
        },
      });

      inactiveMeters = await prisma.meter.count({
        where: {
          OR: [
            { status: "INACTIVE" },
            {
              status: "ACTIVE",
              readings: { none: { timestamp: { gte: last24Hours } } },
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

    let activeCooperatives = 0;
    try {
      activeCooperatives = await prisma.cooperative.count({
        where: { status: "ACTIVE" },
      });
    } catch {
      activeCooperatives = 0;
    }

    let lastReadingTimestamp = null;
    try {
      const lastReading = await prisma.reading.findFirst({
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      });
      lastReadingTimestamp = lastReading?.timestamp || null;
    } catch {
      lastReadingTimestamp = null;
    }

    // Signal quality — promedio RSSI/SNR últimas 24h
    let signalQuality: { avgRssi: number; avgSnr: number; quality: "EXCELLENT" | "GOOD" | "POOR" } = {
      avgRssi: 0,
      avgSnr: 0,
      quality: "POOR",
    };
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const signalResult = await prisma.rxInfo.aggregate({
        where: {
          time: { gte: last24h },
          rssi: { not: null },
          lora_snr: { not: null },
        },
        _avg: { rssi: true, lora_snr: true },
      });
      const avgRssi = Math.round(signalResult._avg.rssi ?? 0);
      const avgSnr = Number((signalResult._avg.lora_snr ?? 0).toFixed(1));
      const quality =
        avgRssi > -85 && avgSnr > 5
          ? "EXCELLENT"
          : avgRssi > -100 && avgSnr > 0
          ? "GOOD"
          : "POOR";
      signalQuality = { avgRssi, avgSnr, quality };
    } catch {
      // mantener valores default
    }

    // Uptime % — medidores activos / total (ya calculado)
    const uptimePercentage = totalMeters > 0 ? Math.round((activeMeters / totalMeters) * 100) : 0;

    // Temperatura promedio del agua — última lectura por medidor activo
    let avgTemperature: number | null = null;
    try {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const tempReadings = await prisma.reading.findMany({
        where: {
          timestamp: { gte: last24h },
          real_time_temperature: { not: null },
          meter: { status: "ACTIVE" },
        },
        select: { real_time_temperature: true },
        take: 200,
      });
      const temps: number[] = [];
      for (const r of tempReadings) {
        if (!r.real_time_temperature) continue;
        try {
          const raw = r.real_time_temperature.trim();
          if (raw.length === 6) {
            const val = parseFloat(raw.slice(2, 4) + "." + raw.slice(0, 2));
            if (!isNaN(val) && val > 0 && val < 50) temps.push(val);
          }
        } catch {
          // ignorar lecturas inválidas
        }
      }
      if (temps.length > 0) {
        avgTemperature = parseFloat((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1));
      }
    } catch {
      avgTemperature = null;
    }

    let overallMeterStatus: MeterStatus = MeterStatus.ACTIVE;
    let smartMeters = 0;
    let mechanicalMeters = 0;
    try {
      const meters = await prisma.meter.findMany({
        select: { status: true, meter_type: true },
      });
      overallMeterStatus = getOverallMeterStatus(meters.map((m) => m.status));
      smartMeters = meters.filter((m) => m.meter_type === "SMART").length;
      mechanicalMeters = meters.filter((m) => m.meter_type === "MECHANICAL").length;
    } catch {
      overallMeterStatus = MeterStatus.ACTIVE;
    }

    const response = {
      meters: {
        total: totalMeters,
        active: activeMeters,
        inactive: inactiveMeters,
        maintenance: maintenanceMeters,
        faulty: faultyMeters,
        overallStatus: overallMeterStatus,
        uptimePercentage,
        smart: smartMeters,
        mechanical: mechanicalMeters,
      },
      alerts: {
        totalAlerts,
        problematicMeters: faultyMeters + maintenanceMeters + inactiveMeters,
      },
      consumption: {
        total: totalConsumption,
        readings: totalReadings,
      },
      signal: signalQuality,
      temperature: { avg: avgTemperature },
      systemHealth:
        faultyMeters === 0 && maintenanceMeters === 0 && inactiveMeters === 0
          ? "EXCELLENT"
          : faultyMeters === 0 && maintenanceMeters < 3 && inactiveMeters < 5
          ? "GOOD"
          : "ATTENTION",
      lastReadingTimestamp,
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