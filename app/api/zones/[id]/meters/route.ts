import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { ZoneMeter } from "@/types/zones/zone-types";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Interpreta YYYY-MM-DD como inicio de dia en UTC-3.
function parseStartOfDayUtcMinus3(dateInput: string): Date {
  const [year, month, day] = dateInput.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 3, 0, 0, 0));
}

// Interpreta YYYY-MM-DD como fin de dia en UTC-3.
function parseEndOfDayUtcMinus3(dateInput: string): Date {
  const [year, month, day] = dateInput.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1, 2, 59, 59, 999));
}

function getTodayDateInputUtcMinus3(): string {
  const shifted = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(shifted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) {
      return NextResponse.json(
        { error: "Zona no encontrada" },
        { status: 404 },
      );
    }

    const polygon = zone.polygon as unknown as PolygonPoint[];

    const todayDateAR = getTodayDateInputUtcMinus3();
    const [yearAR, monthAR] = todayDateAR.split("-").map(Number);
    const currentBimesterStartMonth = monthAR % 2 === 0 ? monthAR - 1 : monthAR;
    const defaultStartDate = `${yearAR}-${String(currentBimesterStartMonth).padStart(2, "0")}-01`;

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Si no llegan fechas, usamos bimestre actual y cierre al "hoy" en UTC-3.
    const startDateInput = startDateParam ?? defaultStartDate;
    const endDateInput = endDateParam ?? todayDateAR;
    const periodStart = parseStartOfDayUtcMinus3(startDateInput);
    const periodEnd = parseEndOfDayUtcMinus3(endDateInput);
    const todayStart = parseStartOfDayUtcMinus3(todayDateAR);

    const meters = await prisma.meter.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
        
      },
      include: {
        userMeters: {
          include: { user: { include: { address: true } } },
          orderBy: { assigned_at: "desc" },
          take: 1,
        },
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1,
          include: { statuses: { take: 1 } },
        },
      },
    });

    // Primero filtramos medidores dentro del poligono para evitar
    // traer lecturas de medidores fuera de la zona.
    const metersInZone = meters.filter((m) =>
      pointInPolygon(m.lat!, m.lng!, polygon),
    );
    const meterIdsInZone = metersInZone.map((m) => m.id);

    // Lecturas del mes para cada medidor de la zona.
    // Con esto obtenemos la primera y la ultima lectura del periodo actual.
    const periodReadings = meterIdsInZone.length
      ? await prisma.reading.findMany({
          where: {
            meter_id: { in: meterIdsInZone },
            timestamp: { gte: periodStart, lte: periodEnd },
          },
          select: {
            meter_id: true,
            timestamp: true,
            cumulative_flow: true,
            observations: true,
          },
          orderBy: [{ meter_id: "asc" }, { timestamp: "asc" }],
        })
      : [];

    // Estructuras en memoria para lookup O(1) durante el mapeo final.
    const firstReadingInPeriodByMeter = new Map<string, string | null>();
    const latestReadingInPeriodByMeter = new Map<string, string | null>();
    const latestReadingMetaInPeriodByMeter = new Map<
      string,
      { timestamp: Date; observations: string | null }
    >();
    for (const reading of periodReadings) {
      if (!firstReadingInPeriodByMeter.has(reading.meter_id)) {
        firstReadingInPeriodByMeter.set(
          reading.meter_id,
          reading.cumulative_flow ?? null,
        );
      }
      latestReadingInPeriodByMeter.set(
        reading.meter_id,
        reading.cumulative_flow ?? null,
      );
      latestReadingMetaInPeriodByMeter.set(reading.meter_id, {
        timestamp: reading.timestamp,
        observations: reading.observations ?? null,
      });
    }

    const toNumber = (value: string | null | undefined): number | null => {
      if (!value) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const formatFlow = (value: number | null): string | null => {
      if (value === null) return null;
      return value.toFixed(3);
    };

    const inZone: ZoneMeter[] = metersInZone.map((m) => {
      const user = m.userMeters[0]?.user ?? null;
      const lastReading = m.readings[0] ?? null;
      const read_today =
        lastReading != null && lastReading.timestamp >= todayStart;
      const latestPeriodCumulative = toNumber(
        latestReadingInPeriodByMeter.get(m.id),
      );
      const latestPeriodMeta = latestReadingMetaInPeriodByMeter.get(m.id);
      const firstPeriodCumulative = toNumber(
        firstReadingInPeriodByMeter.get(m.id) ?? null,
      );
      // Consumo del periodo = ultimo acumulado del periodo - primer acumulado del periodo.
      const monthCumulativeFlow =
        latestPeriodCumulative !== null && firstPeriodCumulative !== null
          ? formatFlow(
              Math.max(0, latestPeriodCumulative - firstPeriodCumulative),
            )
          : null;

      return {
        id: m.id,
        dev_eui: m.dev_eui,
        device_name: m.device_name,
        meter_type: m.meter_type,
        street_address: m.street_address ?? null,
        lat: m.lat,
        lng: m.lng,
        status: m.status,
        userName: user
          ? `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim()
          : null,
        shortData: user?.address?.shortData ?? user?.address?.data ?? null,
        cumulative_flow: lastReading?.cumulative_flow ?? null,
        month_cumulative_flow: monthCumulativeFlow,
        last_reading_value: lastReading?.instantaneous_flow ?? null,
        // Para reporte por periodo, priorizamos fecha/obs de la ultima lectura dentro del periodo.
        last_reading_date: latestPeriodMeta?.timestamp ?? lastReading?.timestamp ?? null,
        last_reading_observations:
          latestPeriodMeta?.observations ?? lastReading?.observations ?? null,
        read_today,
      };
    });

    return NextResponse.json(inZone);
  } catch (error) {
    console.error("[GET ZONE METERS]", error);
    return NextResponse.json(
      { error: "Error al obtener medidores de la zona" },
      { status: 500 },
    );
  }
}
