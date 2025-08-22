import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("[URGENCIES] Iniciando consulta...");

    // Obtener medidores con problemas críticos
    const criticalMeters = await prisma.meter.findMany({
      where: {
        OR: [{ status: "FAULTY" }, { operational_status: "ERROR" }],
      },
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
        readings: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
      take: 10,
    });

    console.log(
      "[URGENCIES] Medidores críticos encontrados:",
      criticalMeters.length
    );

    // Obtener lecturas con alarmas
    const alarmReadings = await prisma.reading.findMany({
      where: {
        OR: [{ alarm_status: { not: null } }, { error_code: { not: null } }],
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
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
      orderBy: {
        timestamp: "desc",
      },
      take: 20,
    });

    console.log(
      "[URGENCIES] Lecturas con alarmas encontradas:",
      alarmReadings.length
    );

    // Obtener medidores sin lecturas recientes (más de 24 horas)
    const inactiveMeters = await prisma.meter.findMany({
      where: {
        readings: {
          none: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        },
      },
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
      take: 10,
    });

    console.log(
      "[URGENCIES] Medidores inactivos encontrados:",
      inactiveMeters.length
    );

    // Obtener usuarios con medidores problemáticos
    const usersWithProblems = await prisma.user.findMany({
      where: {
        userMeters: {
          some: {
            meter: {
              OR: [{ status: "FAULTY" }, { operational_status: "ERROR" }],
            },
          },
        },
      },
      include: {
        address: true,
        userMeters: {
          include: {
            meter: true,
          },
        },
      },
      take: 10,
    });

    console.log(
      "[URGENCIES] Usuarios con problemas encontrados:",
      usersWithProblems.length
    );

    // Formatear alertas por prioridad con verificaciones de seguridad
    const alerts = {
      critical: criticalMeters.map((meter) => {
        const firstUserMeter =
          meter.userMeters && meter.userMeters.length > 0
            ? meter.userMeters[0]
            : null;
        const firstReading =
          meter.readings && meter.readings.length > 0
            ? meter.readings[0]
            : null;

        return {
          type: "CRITICAL_METER",
          priority: "HIGH",
          meter: {
            id: meter.id,
            device_name: meter.device_name || "Sin nombre",
            status: meter.status,
            operational_status: meter.operational_status,
          },
          user: firstUserMeter?.user
            ? {
                name:
                  `${firstUserMeter.user.firstName || ""} ${
                    firstUserMeter.user.lastName || ""
                  }`.trim() || "Usuario desconocido",
                address:
                  firstUserMeter.user.address?.shortData ||
                  "Dirección no disponible",
              }
            : null,
          lastReading: firstReading
            ? {
                timestamp: firstReading.timestamp,
                flow: firstReading.cumulative_flow,
                temperature: firstReading.real_time_temperature,
              }
            : null,
        };
      }),
      alarms: alarmReadings.map((reading) => {
        const firstUserMeter =
          reading.meter.userMeters && reading.meter.userMeters.length > 0
            ? reading.meter.userMeters[0]
            : null;

        return {
          type: "ALARM",
          priority: "MEDIUM",
          reading: {
            id: reading.id,
            timestamp: reading.timestamp,
            alarm_status: reading.alarm_status,
            error_code: reading.error_code,
          },
          meter: {
            id: reading.meter.id,
            device_name: reading.meter.device_name || "Sin nombre",
            status: reading.meter.status,
          },
          user: firstUserMeter?.user
            ? {
                name:
                  `${firstUserMeter.user.firstName || ""} ${
                    firstUserMeter.user.lastName || ""
                  }`.trim() || "Usuario desconocido",
                address:
                  firstUserMeter.user.address?.shortData ||
                  "Dirección no disponible",
              }
            : null,
        };
      }),
      inactive: inactiveMeters.map((meter) => {
        const firstUserMeter =
          meter.userMeters && meter.userMeters.length > 0
            ? meter.userMeters[0]
            : null;

        return {
          type: "INACTIVE_METER",
          priority: "LOW",
          meter: {
            id: meter.id,
            device_name: meter.device_name || "Sin nombre",
            status: meter.status,
          },
          user: firstUserMeter?.user
            ? {
                name:
                  `${firstUserMeter.user.firstName || ""} ${
                    firstUserMeter.user.lastName || ""
                  }`.trim() || "Usuario desconocido",
                address:
                  firstUserMeter.user.address?.shortData ||
                  "Dirección no disponible",
              }
            : null,
          lastActivity: "Más de 24 horas",
        };
      }),
    };

    // Calcular métricas de urgencias
    const urgencyMetrics = {
      totalAlerts:
        alerts.critical.length + alerts.alarms.length + alerts.inactive.length,
      criticalCount: alerts.critical.length,
      alarmCount: alerts.alarms.length,
      inactiveCount: alerts.inactive.length,
      usersAffected: usersWithProblems.length,
      systemHealth:
        alerts.critical.length === 0
          ? "GOOD"
          : alerts.critical.length < 3
          ? "ATTENTION"
          : "CRITICAL",
    };

    console.log("[URGENCIES] Métricas calculadas:", urgencyMetrics);

    const response = {
      alerts,
      urgencyMetrics,
      usersWithProblems: usersWithProblems.map((user) => ({
        id: user.id,
        name:
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          "Usuario desconocido",
        email: user.email || "Email no disponible",
        address: user.address?.shortData || "Dirección no disponible",
        problemMeters: user.userMeters.filter(
          (um) =>
            um.meter.status === "FAULTY" ||
            um.meter.operational_status === "ERROR"
        ).length,
      })),
    };

    console.log("[URGENCIES] Respuesta preparada exitosamente");
    return NextResponse.json(response);
  } catch (error) {
    console.error("[URGENCIES] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch urgency information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log("[URGENCIES] Conexión cerrada");
    } catch (error) {
      console.error("[URGENCIES] Error cerrando conexión:", error);
    }
  }
}
