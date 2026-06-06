// app/api/meter/[id]/readings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {

  try {
    const body = await req.json();
    const { instantaneous_flow, observations, photo_url, submitted_by } = body;

    if (!instantaneous_flow) {
      return NextResponse.json(
        { error: "instantaneous_flow es requerido" },
        { status: 400 }
      );
    }

    const meter = await prisma.meter.findUnique({ where: { id: params.id } });
    if (!meter) {
      return NextResponse.json(
        { error: "Medidor no encontrado" },
        { status: 404 }
      );
    }
    if (meter.meter_type !== "MECHANICAL") {
      return NextResponse.json(
        { error: "Solo se pueden registrar lecturas manuales para medidores mecánicos" },
        { status: 400 }
      );
    }

    // Fetch most recent prior reading to calculate consumption
    const previousReading = await prisma.reading.findFirst({
      where: { meter_id: params.id },
      orderBy: { timestamp: "desc" },
    });

    const newValue = parseFloat(instantaneous_flow);
    const prevValue = previousReading?.instantaneous_flow
      ? parseFloat(previousReading.instantaneous_flow)
      : 0;
    const consumption = isNaN(newValue) ? null : Math.max(0, newValue - prevValue);

    const reading = await prisma.reading.create({
      data: {
        meter_id: params.id,
        instantaneous_flow: String(instantaneous_flow),
        cumulative_flow: String(instantaneous_flow),
        consumption,
        observations: observations ?? null,
        photo_url: photo_url ?? null,
        submitted_by: submitted_by ?? null,
        status: "VALID",
      },
    });

    return NextResponse.json(
      { ...reading, previous_value: previousReading?.instantaneous_flow ?? null },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST MANUAL READING]", error);
    return NextResponse.json(
      { error: "Failed to save reading" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function resolveDateRange(params: URLSearchParams): { gte?: Date; lt?: Date } {
  const now = new Date();

  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  if (startDate && endDate) {
    return {
      gte: new Date(startDate + "T00:00:00Z"),
      lt: addDays(new Date(endDate + "T00:00:00Z"), 1),
    };
  }

  const periodMap: Record<string, Date> = {
    "7d": addDays(now, -7),
    "30d": addDays(now, -30),
    "90d": addDays(now, -90),
    "6m": addDays(now, -180),
    "1y": addDays(now, -365),
  };

  const period = params.get("period");
  if (period && periodMap[period]) {
    return { gte: periodMap[period] };
  }

  return {};
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {


  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const dateFilter = resolveDateRange(searchParams);
    const where = {
      meter_id: params.id,
      ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
    };

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where,
        orderBy: { timestamp: "desc" },
        include: {
          statuses: true,
          submittedBy: { select: { firstName: true, lastName: true } },
        },
        skip,
        take: limit,
      }),
      prisma.reading.count({ where }),
    ]);

    // ✅ normalize statuses → status (single object)
    const normalized = readings.map((r) => ({
      ...r,
      statuses: r.statuses[0] || null,
    }));

    return NextResponse.json({
      data: normalized,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("[GET METER READINGS]", error);
    return NextResponse.json(
      { error: "Failed to fetch readings" },
      { status: 500 }
    );
  }
}
