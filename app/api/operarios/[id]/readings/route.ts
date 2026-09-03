import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export async function GET(_: Request, { params }: Context) {
  try {
    const readings = await prisma.reading.findMany({
      where: { submitted_by: params.id },
      orderBy: { timestamp: "desc" },
      take: 30,
      include: {
        meter: {
          select: { id: true, device_name: true, street_address: true },
        },
      },
    });

    return NextResponse.json(
      readings.map((r) => ({
        id: r.id,
        timestamp: r.timestamp,
        instantaneous_flow: r.instantaneous_flow,
        consumption: r.consumption,
        observations: r.observations,
        meter_id: r.meter_id,
        meter_name: r.meter?.device_name ?? null,
        meter_address: r.meter?.street_address ?? null,
      }))
    );
  } catch (error) {
    console.error("[GET OPERARIO READINGS]", error);
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 });
  }
}
