import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// GET /api/operarios/zones — zones assigned to the authenticated operator
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const zoneOperators = await prisma.zoneOperator.findMany({
      where: { user_id: session.user.id },
      include: { zone: true },
    });

    const zones = await Promise.all(
      zoneOperators.map(async (zo) => {
        const zone = zo.zone;
        const polygon = zone.polygon as unknown as PolygonPoint[];

        // Count MECHANICAL meters in this zone
        const allMeters = await prisma.meter.findMany({
          where: {
            meter_type: "MECHANICAL",
            lat: { not: null },
            lng: { not: null },
          },
          select: { id: true, lat: true, lng: true },
        });

        const metersInZone = allMeters.filter((m) =>
          pointInPolygon(m.lat!, m.lng!, polygon)
        );

        // Count operators in zone
        const operatorCount = await prisma.zoneOperator.count({
          where: { zone_id: zone.id },
        });

        return {
          id: zone.id,
          name: zone.name,
          color: zone.color,
          status: zone.status,
          meter_count: metersInZone.length,
          operator_count: operatorCount,
        };
      })
    );

    return NextResponse.json(zones);
  } catch (error) {
    console.error("[GET OPERARIO ZONES]", error);
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
