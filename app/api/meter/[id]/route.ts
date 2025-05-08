// app/api/meter/[id]/route.ts
import { MeterStatus, OperationalStatus, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type Context = {
  params: { id: string };
};

export async function GET(_: Request, { params }: Context) {
  try {
    const meter = await prisma.userMeter.findFirst({
      where: { user_id: params.id },
      include: {
        meter: true,
      },
    });

    if (!meter)
      return NextResponse.json({ error: "Meter not found" }, { status: 404 });

    return NextResponse.json(meter);
  } catch (error) {
    console.error("[GET METER]", error);
    return NextResponse.json(
      { error: "Failed to fetch meter" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const {
      dev_eui,
      device_name,
      application_id,
      application_name,
      lat,
      lng,
      status,
      operational_status,
    } = body;

    const updated = await prisma.meter.update({
      where: { id: params.id },
      data: {
        dev_eui,
        device_name,
        application_id,
        application_name,
        lat,
        lng,
        status: status as MeterStatus,
        operational_status: operational_status as OperationalStatus,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE METER]", error);
    return NextResponse.json(
      { error: "Failed to update meter" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    await prisma.meter.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Meter deleted" });
  } catch (error) {
    console.error("[DELETE METER]", error);
    return NextResponse.json(
      { error: "Failed to delete meter" },
      { status: 400 }
    );
  }
}
