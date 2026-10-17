import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

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

    // If a circuit is defined, respect its order and only include circuit meters
    const circuit = await prisma.meterCircuit.findMany({
      where: { zone_id: params.zoneId },
      orderBy: { order: "asc" },
      select: { meter_id: true, order: true },
    });

    const hasCircuit = circuit.length > 0;
    let orderedMeters = inZone;

    if (hasCircuit) {
      const orderMap = new Map(circuit.map((c) => [c.meter_id, c.order]));
      orderedMeters = inZone
        .filter((m) => orderMap.has(m.id))
        .sort((a, b) => orderMap.get(a.id)! - orderMap.get(b.id)!);
    }

    const route = orderedMeters.map((m) => {
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
        order: hasCircuit ? (new Map(circuit.map((c) => [c.meter_id, c.order])).get(m.id) ?? null) : null,
      };
    });

    return NextResponse.json({
      zone: { id: zone.id, name: zone.name, color: zone.color },
      meters: route,
      total: route.length,
      read_count: route.filter((m) => m.read_today).length,
      has_circuit: hasCircuit,
    });
  } catch (error) {
    console.error("[GET READING ROUTE]", error);
    return NextResponse.json(
      { error: "Error al obtener ruta de lectura" },
      { status: 500 }
    );
  }
}
