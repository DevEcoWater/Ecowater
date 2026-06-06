import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/operarios/zones/[zoneId]/reading-route
// Returns MECHANICAL meters in the zone polygon with read status for today
export async function GET(
  _req: Request,
  { params }: { params: { zoneId: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.zoneId } });
    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    const polygon = zone.polygon as unknown as PolygonPoint[];

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const meters = await prisma.meter.findMany({
      where: {
        meter_type: "MECHANICAL",
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
        },
      },
    });

    const inZone = meters.filter((m) =>
      pointInPolygon(m.lat!, m.lng!, polygon)
    );

    const route = inZone.map((m) => {
      const user = m.userMeters[0]?.user ?? null;
      const lastReading = m.readings[0] ?? null;
      const read_today =
        lastReading != null && lastReading.timestamp >= todayStart;

      return {
        id: m.id,
        device_name: m.device_name,
        street_address: m.street_address ?? null,
        lat: m.lat,
        lng: m.lng,
        userName: user
          ? `${user.lastName ?? ""}, ${user.firstName ?? ""}`.trim()
          : null,
        userId: user?.id ?? null,
        last_reading_value: lastReading?.instantaneous_flow ?? null,
        last_reading_date: lastReading?.timestamp ?? null,
        read_today,
        reading_time_today: read_today ? lastReading?.timestamp : null,
      };
    });

    return NextResponse.json({
      zone: { id: zone.id, name: zone.name, color: zone.color },
      meters: route,
      total: route.length,
      read_count: route.filter((m) => m.read_today).length,
    });
  } catch (error) {
    console.error("[GET READING ROUTE]", error);
    return NextResponse.json(
      { error: "Error al obtener ruta de lectura" },
      { status: 500 }
    );
  }
}
