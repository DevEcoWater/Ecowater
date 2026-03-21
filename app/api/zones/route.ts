import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [zones, meters] = await Promise.all([
      prisma.zone.findMany({ orderBy: { created_at: "desc" } }),
      prisma.meter.findMany({
        where: { lat: { not: null }, lng: { not: null } },
        select: { lat: true, lng: true },
      }),
    ]);

    const zonesWithCount = zones.map((zone) => {
      const polygon = zone.polygon as PolygonPoint[];
      const meter_count = meters.filter((m) =>
        pointInPolygon(m.lat!, m.lng!, polygon)
      ).length;
      return { ...zone, meter_count };
    });

    return NextResponse.json(zonesWithCount);
  } catch (error) {
    console.error("[GET ZONES]", error);
    return NextResponse.json({ error: "Error al obtener zonas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, color, polygon } = body;

    if (!name || !polygon || !Array.isArray(polygon)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        color: color ?? "#3B82F6",
        polygon,
      },
    });

    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error("[POST ZONES]", error);
    return NextResponse.json({ error: "Error al crear zona" }, { status: 500 });
  }
}
