// app/api/meter/[id]/route.ts
import { MeterStatus, MeterType, OperationalStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: { id: string };
};

export async function GET(_: Request, { params }: Context) {
  try {
    const meter = await prisma.meter.findUnique({
      where: { id: params.id },
      include: {
        userMeters: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!meter)
      return NextResponse.json({ error: "Meter not found" }, { status: 404 });

    const lastReading = await prisma.reading.findFirst({
      where: { meter_id: meter.id },
      orderBy: { timestamp: "desc" },
      include: {
        statuses: {
          take: 1,
        },
      },
    });

    const formattedReading = lastReading
      ? {
          ...lastReading,
          statuses: lastReading.statuses[0] || null,
        }
      : null;

    // Calcular estado de conectividad basado en la última lectura
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const isValidTimestamp =
      lastReading && lastReading.timestamp <= oneHourFromNow;
    const isActive =
      isValidTimestamp && lastReading && lastReading.timestamp >= last24Hours;

    const connectivityStatus = isActive
      ? "ONLINE"
      : lastReading
      ? "STALE"
      : "OFFLINE";
    const hoursSinceLastReading = lastReading
      ? Math.floor(
          (now.getTime() - lastReading.timestamp.getTime()) / (1000 * 60 * 60)
        )
      : null;

    // ✅ Flatten user relation
    const userMeter = meter.userMeters[0] || null;
    const rawResponse = {
      ...meter,
      user: userMeter ? userMeter.user.id : null,
      userName: userMeter
        ? `${userMeter.user.lastName ?? ""} ${userMeter.user.firstName ?? ""}`.trim() || null
        : null,
      reading: formattedReading,
      connectivity: {
        status: connectivityStatus,
        lastSeen: lastReading?.timestamp || null,
        signalQuality: isActive ? "EXCELLENT" : "UNKNOWN",
      },
      dataFreshness: {
        isRecent: isActive,
        age: hoursSinceLastReading
          ? `${hoursSinceLastReading}h atrás`
          : "Desconocido",
        warning:
          !isActive && lastReading ? "Medidor sin actividad reciente" : null,
      },
    };

    // remove nested userMeters if you don't want it
    delete rawResponse.userMeters;

    return NextResponse.json(rawResponse);
  } catch (error) {
    console.error("[GET METER]", error);
    return NextResponse.json(
      { error: "Failed to fetch meter" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 });
    }

    const meter = await prisma.meter.findUnique({
      where: { id: params.id },
      include: { userMeters: { select: { id: true } } },
    });

    if (!meter) {
      return NextResponse.json({ error: "Meter not found" }, { status: 404 });
    }

    // Guard: mechanical meters can only be ACTIVE when they have an assigned user.
    if (meter.meter_type === "MECHANICAL" && status === "ACTIVE" && meter.userMeters.length === 0) {
      return NextResponse.json(
        { error: "El medidor no tiene usuario asignado. Asigná un usuario antes de activarlo." },
        { status: 409 }
      );
    }

    const updated = await prisma.meter.update({
      where: { id: params.id },
      data: { status: status as MeterStatus, updated_at: new Date() },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH METER STATUS]", error);
    return NextResponse.json({ error: "Failed to update meter status" }, { status: 500 });
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
      meter_type,
      street_address,
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
        meter_type: meter_type as MeterType,
        street_address,
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
