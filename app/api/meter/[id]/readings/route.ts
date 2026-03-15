// app/api/meter/[id]/readings/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

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
  const prisma = new PrismaClient();

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
        include: { statuses: true },
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
