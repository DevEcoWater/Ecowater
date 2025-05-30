// app/api/meter/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { MeterStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { page, limit, search, status } = getPaginationParams({
      url: req.url,
    });

    const [rawMeters, total] = await Promise.all([
      prisma.meter.findMany({
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userMeters: {
            include: {
              user: {
                include: {
                  address: true,
                },
              },
            },
          },
          readings: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.meter.count(),
    ]);

    const meters = rawMeters.map(({ userMeters, ...meter }) => {
      const userMeter = userMeters[0];

      if (!userMeter) {
        return { ...meter, userMeter: null };
      }

      const shortData = userMeter.user?.address?.shortData ?? null;
      const userName = userMeter.user
        ? `${userMeter.user.firstName} ${userMeter.user.lastName}`
        : null;

      return {
        ...meter,
        userMeter: {
          id: userMeter.id,
          assigned_at: userMeter.assigned_at,
          meter_id: userMeter.meter_id,
          user_id: userMeter.user_id,
          shortData,
          userName,
        },
      };
    });

    let filteredMeters = meters;
    if (search) {
      filteredMeters = filteredMeters.filter((meter) =>
        meter.device_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== "total") {
      const normalizedStatus = status.toUpperCase() as MeterStatus;
      filteredMeters = filteredMeters.filter(
        (meter) => meter.status === normalizedStatus
      );
    }

    const counts = {
      actives: rawMeters.filter((m) => m.status === "ACTIVE").length,
      inactives: rawMeters.filter((m) => m.status === "INACTIVE").length,
      maintenances: rawMeters.filter((m) => m.status === "MAINTENANCE").length,
      faultys: rawMeters.filter((m) => m.status === "FAULTY").length,
    };

    return NextResponse.json({
      data: meters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts,
    });
  } catch (error) {
    console.error("[GET METERS WITH PAGINATION + STATUS]", error);
    return NextResponse.json(
      { error: "Failed to fetch meters" },
      { status: 500 }
    );
  }
}
