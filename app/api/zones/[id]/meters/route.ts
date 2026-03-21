import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { ZoneMeter } from "@/types/zones/zone-types";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    const polygon = zone.polygon as PolygonPoint[];

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

    const inZone: ZoneMeter[] = meters
      .filter((m) => pointInPolygon(m.lat!, m.lng!, polygon))
      .map((m) => {
        const user = m.userMeters[0]?.user ?? null;
        const lastReading = m.readings[0] ?? null;

        return {
          id: m.id,
          dev_eui: m.dev_eui,
          device_name: m.device_name,
          lat: m.lat,
          lng: m.lng,
          status: m.status,
          userName: user
            ? `${user.lastName ?? ""} ${user.firstName ?? ""}`.trim()
            : null,
          shortData: user?.address?.shortData ?? user?.address?.data ?? null,
          cumulative_flow: lastReading?.cumulative_flow ?? null,
        };
      });

    return NextResponse.json(inZone);
  } catch (error) {
    console.error("[GET ZONE METERS]", error);
    return NextResponse.json(
      { error: "Error al obtener medidores de la zona" },
      { status: 500 }
    );
  }
}
