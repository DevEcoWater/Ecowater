import { NextResponse } from "next/server";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const meter = await prisma.meter.findUnique({
      where: { id: params.id },
      select: { lat: true, lng: true },
    });

    if (!meter?.lat || !meter?.lng) {
      return NextResponse.json(null);
    }

    const zones = await prisma.zone.findMany();

    const match = zones.find((zone) =>
      pointInPolygon(meter.lat!, meter.lng!, zone.polygon as unknown as PolygonPoint[])
    );

    return NextResponse.json(match ?? null);
  } catch (error) {
    console.error("[GET METER ZONE]", error);
    return NextResponse.json(null);
  }
}
