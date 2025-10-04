// app/api/meter/[id]/readings/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where: { meter_id: params.id },
        orderBy: { timestamp: "desc" },
        include: { statuses: true }, // still array in DB
        skip,
        take: limit,
      }),
      prisma.reading.count({ where: { meter_id: params.id } }),
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
