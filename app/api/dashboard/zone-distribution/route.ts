import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import {
  DASHBOARD_TZ,
  getCachedDistribution,
  resolveRange,
} from "@/lib/dashboard/consumption-distribution";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { startDate, endDate } = resolveRange(searchParams, DASHBOARD_TZ);

    const [meterTotals, zones, meters] = await Promise.all([
      getCachedDistribution(startDate.toISOString(), endDate.toISOString()),
      prisma.zone.findMany({
        where: { status: "ACTIVE" },
        orderBy: { created_at: "asc" },
        select: { id: true, name: true, color: true, polygon: true },
      }),
      prisma.meter.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: { id: true, lat: true, lng: true },
      }),
    ]);

    const consumoByMeter = new Map(meterTotals.map((m) => [m.meterId, m.totalConsumo]));
    const zoneStats = zones.map((z) => ({
      zoneId: z.id,
      name: z.name,
      color: z.color,
      polygon: z.polygon as unknown as PolygonPoint[],
      totalConsumo: 0,
      meterCount: 0,
    }));

    let unzonedTotal = 0;

    // Cada medidor suma solo en la primera zona que lo contiene, para no duplicar consumo
    for (const meter of meters) {
      const consumo = consumoByMeter.get(meter.id) ?? 0;
      const zone = zoneStats.find((z) => pointInPolygon(meter.lat!, meter.lng!, z.polygon));
      if (zone) {
        zone.totalConsumo += consumo;
        zone.meterCount += 1;
      } else {
        unzonedTotal += consumo;
      }
    }

    return NextResponse.json({
      zones: zoneStats
        .map(({ polygon, totalConsumo, ...z }) => ({
          ...z,
          totalConsumo: Math.round(totalConsumo * 100) / 100,
        }))
        .sort((a, b) => b.totalConsumo - a.totalConsumo),
      unzonedTotal: Math.round(unzonedTotal * 100) / 100,
    });
  } catch (e) {
    console.error("[GET ZONE DISTRIBUTION]", e);
    return NextResponse.json({ error: "Failed to fetch zone distribution" }, { status: 500 });
  }
}
