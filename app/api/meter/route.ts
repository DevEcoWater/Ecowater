// app/api/meter/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { page, limit, skip } = getPaginationParams({ url: req.url });

    const [meters, total] = await Promise.all([
      prisma.meter.findMany({
        skip,
        take: limit,
        include: {
          userMeters: true,
          readings: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.meter.count(),
    ]);

    return NextResponse.json({
      data: meters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET METERS WITH PAGINATION]", error);
    return NextResponse.json(
      { error: "Failed to fetch meters" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const meter = await prisma.meter.create({
      data: {
        dev_eui: body.dev_eui,
        device_name: body.device_name,
        application_id: body.application_id,
        application_name: body.application_name,
        lat: body.lat,
        lng: body.lng,
        status: body.status ?? "ACTIVE",
        operational_status: body.operational_status ?? "OPERATIONAL",
      },
    });

    return NextResponse.json(meter, { status: 201 });
  } catch (error) {
    console.error("[CREATE METER]", error);
    return NextResponse.json(
      { error: "Failed to create meter" },
      { status: 400 }
    );
  }
}
