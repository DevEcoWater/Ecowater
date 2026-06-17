import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/operarios/zones — zones assigned to the authenticated operator
// Returns per-zone: total zone meters, operator-assigned meters, read today count.
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    const zoneOperators = await prisma.zoneOperator.findMany({
      where: { user_id: userId },
      include: {
        zone: {
          include: { _count: { select: { zoneOperators: true } } },
        },
      },
    });

    // Fetch all mechanical meters once — avoids N+1.
    const allMechanicalMeters = await prisma.meter.findMany({
      where: {
        meter_type: "MECHANICAL",
        lat: { not: null },
        lng: { not: null },
      },
      select: { id: true, lat: true, lng: true },
    });

    // All meter IDs read today — one query for all zones.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const readingsToday = await prisma.reading.findMany({
      where: {
        meter_id: { in: allMechanicalMeters.map((m) => m.id) },
        timestamp: { gte: todayStart },
      },
      select: { meter_id: true },
      distinct: ["meter_id"],
    });
    const readTodayIds = new Set(readingsToday.map((r) => r.meter_id));

    const zones = zoneOperators.map((zo) => {
      const zone = zo.zone;
      const polygon = zone.polygon as unknown as PolygonPoint[];

      // Cast to access route_assignments (new field, may not be in generated client yet).
      const zoneAny = zone as typeof zone & { route_assignments?: unknown };
      const routeAssignments =
        (zoneAny.route_assignments as Record<string, string> | null) ?? null;

      const metersInZone = allMechanicalMeters.filter((m) =>
        pointInPolygon(m.lat!, m.lng!, polygon)
      );

      const assignedMeters = routeAssignments
        ? metersInZone.filter((m) => routeAssignments[m.id] === userId)
        : [];

      const readCountToday = assignedMeters.filter((m) =>
        readTodayIds.has(m.id)
      ).length;

      return {
        id: zone.id,
        name: zone.name,
        color: zone.color,
        status: zone.status,
        meter_count: metersInZone.length,
        assigned_count: assignedMeters.length,
        read_count_today: readCountToday,
        operator_count: zone._count.zoneOperators,
      };
    });

    return NextResponse.json(zones);
  } catch (error) {
    console.error("[GET OPERARIO ZONES]", error);
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
