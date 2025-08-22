import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Obtener última lectura
    const lastReading = await prisma.reading.findFirst({
      orderBy: {
        timestamp: "desc",
      },
      include: {
        meter: {
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
          },
        },
      },
    });

    // Obtener último usuario creado
    const lastUser = await prisma.user.findFirst({
      orderBy: {
        created_at: "desc",
      },
      include: {
        address: true,
      },
    });

    // Obtener último medidor creado
    const lastMeter = await prisma.meter.findFirst({
      orderBy: {
        created_at: "desc",
      },
    });

    // Obtener última cooperativa creada
    const lastCooperative = await prisma.cooperative.findFirst({
      orderBy: {
        created_at: "desc",
      },
    });

    // Obtener estadísticas de actividad reciente (últimas 24 horas)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [recentReadings, recentUsers, recentMeters] = await Promise.all([
      prisma.reading.count({
        where: {
          timestamp: {
            gte: yesterday,
          },
        },
      }),
      prisma.user.count({
        where: {
          created_at: {
            gte: yesterday,
          },
        },
      }),
      prisma.meter.count({
        where: {
          created_at: {
            gte: yesterday,
          },
        },
      }),
    ]);

    return NextResponse.json({
      lastReading: lastReading
        ? {
            id: lastReading.id,
            timestamp: lastReading.timestamp,
            meter: {
              id: lastReading.meter.id,
              device_name: lastReading.meter.device_name,
              status: lastReading.meter.status,
            },
            user: lastReading.meter.userMeters[0]?.user
              ? {
                  name: `${lastReading.meter.userMeters[0].user.firstName} ${lastReading.meter.userMeters[0].user.lastName}`,
                  address:
                    lastReading.meter.userMeters[0].user.address.shortData,
                }
              : null,
            flow: lastReading.cumulative_flow,
            temperature: lastReading.real_time_temperature,
          }
        : null,
      lastUser: lastUser
        ? {
            id: lastUser.id,
            name: `${lastUser.firstName} ${lastUser.lastName}`,
            email: lastUser.email,
            created_at: lastUser.created_at,
            address: lastUser.address.shortData,
          }
        : null,
      lastMeter: lastMeter
        ? {
            id: lastMeter.id,
            device_name: lastMeter.device_name,
            status: lastMeter.status,
            created_at: lastMeter.created_at,
          }
        : null,
      lastCooperative: lastCooperative
        ? {
            id: lastCooperative.id,
            name: lastCooperative.name,
            location: lastCooperative.location,
            created_at: lastCooperative.created_at,
          }
        : null,
      recentActivity: {
        readings: recentReadings,
        users: recentUsers,
        meters: recentMeters,
        total: recentReadings + recentUsers + recentMeters,
      },
      systemStatus: {
        lastUpdate: lastReading?.timestamp || new Date(),
        isOnline: recentReadings > 0,
        dataFreshness: lastReading
          ? Math.floor(
              (Date.now() - lastReading.timestamp.getTime()) / (1000 * 60)
            ) // minutos
          : "Unknown",
      },
    });
  } catch (error) {
    console.error("[GET LAST UPDATE]", error);
    return NextResponse.json(
      { error: "Failed to fetch last update information" },
      { status: 500 }
    );
  }
}
