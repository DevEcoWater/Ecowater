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

    // build where filters
    const where: any = {};

    if (search) {
      where.OR = [
        { device_name: { contains: search, mode: "insensitive" } },
        { dev_eui: { contains: search, mode: "insensitive" } },
        {
          userMeters: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          },
        },
      ];
    }

    if (status && status !== "total") {
      where.status = status.toUpperCase() as MeterStatus;
    }

    // query meters + total with filters
    const [rawMeters, total] = await Promise.all([
      prisma.meter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userMeters: {
            include: {
              user: { include: { address: true } },
            },
          },
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.meter.count({ where }),
    ]);

    const meters = rawMeters.map(({ userMeters, readings, ...meter }) => {
      const userMeter = userMeters[0];
      const lastReading = readings[0];

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

      // Mapear estado de conectividad a estado de chip
      const chipStatus =
        connectivityStatus === "ONLINE" ? "ACTIVE" : "INACTIVE";

      if (!userMeter) {
        return {
          ...meter,
          userMeter: null,
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
              !isActive && lastReading
                ? "Medidor sin actividad reciente"
                : null,
          },
          // Usar estado de conectividad en lugar del estado de BD
          status: chipStatus as MeterStatus,
        };
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
        // Usar estado de conectividad en lugar del estado de BD
        status: chipStatus as MeterStatus,
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

    // Calcular conteos basados en conectividad real
    const counts = {
      actives: meters.filter((m) => m.connectivity?.status === "ONLINE").length,
      inactives: meters.filter(
        (m) =>
          m.connectivity?.status === "STALE" ||
          m.connectivity?.status === "OFFLINE"
      ).length,
      maintenances: 0, // No aplicamos lógica de conectividad a mantenimiento
      faultys: 0, // No aplicamos lógica de conectividad a fallas
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
