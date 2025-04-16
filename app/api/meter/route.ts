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
