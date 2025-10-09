import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  mapStatusToAlerts,
  groupAlertsBySeverity,
  Alert,
  StatusData,
} from "@/utils/alertMapper";

const prisma = new PrismaClient();

type UrgencyParams = {
  meterId?: string;
  limit?: number;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  types?: string; // comma-separated: "CRITICAL_METER,EMPTY_PIPE_ALARM"
  includeInactive?: boolean;
  context?: "dashboard" | "detail"; // Contexto de uso
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const params: UrgencyParams = {
      meterId: searchParams.get("meterId") || undefined,
      limit: parseInt(searchParams.get("limit") || "100"),
      severity: (searchParams.get("severity") as any) || undefined,
      types: searchParams.get("types") || undefined,
      includeInactive: searchParams.get("includeInactive") === "true",
      context: (searchParams.get("context") as any) || "dashboard",
    };

    // 1. Obtener datos de medidores con información de conectividad
    const meterData = await getMeterDataWithConnectivity(params);

    // 2. Procesar alertas según el contexto
    const processedData = processAlertsByContext(meterData, params);

    // 3. Construir respuesta unificada
    const response = buildUnifiedResponse(processedData, params);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in urgencies API:", error);
    return NextResponse.json(
      { error: "Failed to fetch urgency data", details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Obtiene datos de medidores con información de conectividad
 */
async function getMeterDataWithConnectivity(params: UrgencyParams) {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (params.meterId) {
    // Para detalle de medidor específico
    const meter = await prisma.meter.findUnique({
      where: { id: params.meterId },
      include: {
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1,
          include: {
            statuses: {
              orderBy: { created_at: "desc" },
              take: 1,
            },
          },
        },
        userMeters: {
          include: {
            user: {
              include: { address: true },
            },
          },
        },
      },
    });

    if (!meter) return [];

    const lastReading = meter.readings[0];

    // Validar que el timestamp no sea del futuro (más de 1 hora en el futuro)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const isValidTimestamp =
      lastReading && lastReading.timestamp <= oneHourFromNow;

    const isActive = isValidTimestamp && lastReading.timestamp >= last24Hours;

    return [
      {
        meter,
        lastReading,
        isActive,
        hoursSinceLastReading: lastReading
          ? Math.floor(
              (now.getTime() - lastReading.timestamp.getTime()) /
                (1000 * 60 * 60)
            )
          : null,
        connectivity: {
          status: isActive ? "ONLINE" : lastReading ? "STALE" : "OFFLINE",
          lastSeen: lastReading?.timestamp || null,
          signalQuality: isActive ? "EXCELLENT" : "UNKNOWN",
        },
      },
    ];
  }

  // Para dashboard - todos los medidores
  const meters = await prisma.meter.findMany({
    take: params.limit || 100,
    include: {
      readings: {
        orderBy: { timestamp: "desc" },
        take: 1,
        include: {
          statuses: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
      userMeters: {
        include: {
          user: {
            include: { address: true },
          },
        },
      },
    },
  });

  return meters.map((meter) => {
    const lastReading = meter.readings[0];

    // Validar que el timestamp no sea del futuro (más de 1 hora en el futuro)
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    const isValidTimestamp =
      lastReading && lastReading.timestamp <= oneHourFromNow;

    const isActive = isValidTimestamp && lastReading.timestamp >= last24Hours;

    return {
      meter,
      lastReading,
      isActive,
      hoursSinceLastReading: lastReading
        ? Math.floor(
            (now.getTime() - lastReading.timestamp.getTime()) / (1000 * 60 * 60)
          )
        : null,
      connectivity: {
        status: isActive ? "ONLINE" : lastReading ? "STALE" : "OFFLINE",
        lastSeen: lastReading?.timestamp || null,
        signalQuality: isActive ? "EXCELLENT" : "UNKNOWN",
      },
    };
  });
}

/**
 * Procesa alertas según el contexto de uso
 */
function processAlertsByContext(meterData: any[], params: UrgencyParams) {
  const allAlerts: any[] = [];
  const inactiveMeters: any[] = [];

  for (const data of meterData) {
    const {
      meter,
      lastReading,
      isActive,
      hoursSinceLastReading,
      connectivity,
    } = data;

    if (isActive && lastReading?.statuses[0]) {
      // Medidor activo: mostrar alertas del status actual
      const alerts = mapStatusToAlerts(lastReading.statuses[0] as StatusData);

      const enrichedAlerts = alerts.map((alert) => ({
        ...alert,
        meter: {
          id: meter.id,
          device_name: meter.device_name || "Sin nombre",
          dev_eui: meter.dev_eui || "N/A",
          status: meter.status || "UNKNOWN",
          operational_status: meter.operational_status || "UNKNOWN",
        },
        user: meter.userMeters?.[0]?.user
          ? {
              id: meter.userMeters[0].user.id,
              name: `${meter.userMeters[0].user.firstName} ${meter.userMeters[0].user.lastName}`,
              email: meter.userMeters[0].user.email,
              address:
                meter.userMeters[0].user.address?.shortData || "Sin dirección",
            }
          : null,
        reading: {
          id: lastReading.id,
          timestamp: lastReading.timestamp,
          alarm_status: lastReading.alarm_status,
        },
        created_at: lastReading.statuses[0].created_at,
        dataFreshness: {
          isRecent: true,
          age: "Activo",
          warning: null,
        },
        connectivity,
      }));

      allAlerts.push(...enrichedAlerts);
    } else if (lastReading?.statuses[0]) {
      // Medidor inactivo pero con datos históricos
      if (params.context === "detail") {
        // En detalle: mostrar alertas históricas con contexto
        const alerts = mapStatusToAlerts(lastReading.statuses[0] as StatusData);

        const enrichedAlerts = alerts.map((alert) => ({
          ...alert,
          meter: {
            id: meter.id,
            device_name: meter.device_name || "Sin nombre",
            dev_eui: meter.dev_eui || "N/A",
            status: meter.status || "UNKNOWN",
            operational_status: meter.operational_status || "UNKNOWN",
          },
          user: meter.userMeters?.[0]?.user
            ? {
                id: meter.userMeters[0].user.id,
                name: `${meter.userMeters[0].user.firstName} ${meter.userMeters[0].user.lastName}`,
                email: meter.userMeters[0].user.email,
                address:
                  meter.userMeters[0].user.address?.shortData ||
                  "Sin dirección",
              }
            : null,
          reading: {
            id: lastReading.id,
            timestamp: lastReading.timestamp,
            alarm_status: lastReading.alarm_status,
          },
          created_at: lastReading.statuses[0].created_at,
          dataFreshness: {
            isRecent: false,
            age: hoursSinceLastReading
              ? `${hoursSinceLastReading}h atrás`
              : "Desconocido",
            warning: `Datos de hace ${hoursSinceLastReading || "más de"} horas`,
          },
          connectivity,
        }));

        allAlerts.push(...enrichedAlerts);
      }

      // Agregar alerta de inactividad
      inactiveMeters.push({
        type: "INACTIVE_METER",
        severity: "LOW",
        message: `Medidor inactivo hace ${
          hoursSinceLastReading || "más de"
        } horas`,
        meter: {
          id: meter.id,
          device_name: meter.device_name || "Sin nombre",
          dev_eui: meter.dev_eui || "N/A",
          last_activity: hoursSinceLastReading
            ? `${hoursSinceLastReading}h atrás`
            : "Desconocido",
        },
        user: meter.userMeters?.[0]?.user
          ? {
              name: `${meter.userMeters[0].user.firstName} ${meter.userMeters[0].user.lastName}`,
              address:
                meter.userMeters[0].user.address?.shortData || "Sin dirección",
            }
          : null,
        // Añadimos campos de fecha para que el frontend no muestre "Sin fecha"
        reading: lastReading
          ? {
              id: lastReading.id,
              timestamp: lastReading.timestamp,
              alarm_status: lastReading.alarm_status,
            }
          : undefined,
        created_at:
          (lastReading?.statuses?.[0]?.created_at as any) ||
          (lastReading?.timestamp as any) ||
          (meter.created_at as any),
        dataFreshness: {
          isRecent: false,
          age: hoursSinceLastReading
            ? `${hoursSinceLastReading}h atrás`
            : "Desconocido",
          warning: "Medidor sin actividad reciente",
        },
        connectivity,
      });
    } else {
      // Medidor sin lecturas
      inactiveMeters.push({
        type: "INACTIVE_METER",
        severity: "LOW",
        message: "Medidor sin lecturas registradas",
        meter: {
          id: meter.id,
          device_name: meter.device_name || "Sin nombre",
          dev_eui: meter.dev_eui || "N/A",
          last_activity: "Nunca",
        },
        user: meter.userMeters?.[0]?.user
          ? {
              name: `${meter.userMeters[0].user.firstName} ${meter.userMeters[0].user.lastName}`,
              address:
                meter.userMeters[0].user.address?.shortData || "Sin dirección",
            }
          : null,
        created_at: meter.created_at as any,
        dataFreshness: {
          isRecent: false,
          age: "Nunca",
          warning: "Sin datos de lectura",
        },
        connectivity,
      });
    }
  }

  return { allAlerts, inactiveMeters };
}

/**
 * Construye la respuesta unificada
 */
function buildUnifiedResponse(processedData: any, params: UrgencyParams) {
  const { allAlerts, inactiveMeters } = processedData;

  // Filtrar por severidad y tipos
  let filteredAlerts = allAlerts;
  if (params.severity) {
    filteredAlerts = filteredAlerts.filter(
      (a) => a.severity === params.severity
    );
  }
  if (params.types) {
    const allowedTypes = params.types.split(",").map((t) => t.trim());
    filteredAlerts = filteredAlerts.filter((a) =>
      allowedTypes.includes(a.type)
    );
  }

  // Agrupar por severidad
  const groupedAlerts = groupAlertsBySeverity(filteredAlerts);

  // Incluir medidores inactivos si se solicita
  const inactiveToInclude = params.includeInactive ? inactiveMeters : [];

  return {
    alerts: {
      critical: groupedAlerts.critical,
      high: groupedAlerts.high,
      medium: groupedAlerts.medium,
      low: groupedAlerts.low,
      inactive: inactiveToInclude,
    },
    meta: {
      total: groupedAlerts.total + inactiveToInclude.length,
      criticalCount: groupedAlerts.critical.length,
      highCount: groupedAlerts.high.length,
      mediumCount: groupedAlerts.medium.length,
      lowCount: groupedAlerts.low.length,
      inactiveCount: inactiveToInclude.length,
      meterId: params.meterId || "all",
      limit: params.limit,
      context: params.context,
    },
    systemHealth: getSystemHealth(groupedAlerts, inactiveToInclude.length),
  };
}

/**
 * Calcula el estado de salud del sistema
 */
function getSystemHealth(groupedAlerts: any, inactiveCount: number) {
  const criticalCount = groupedAlerts.critical.length;
  const highCount = groupedAlerts.high.length;
  const mediumCount = groupedAlerts.medium.length;
  const lowCount = groupedAlerts.low.length;

  if (criticalCount > 0) return "CRITICAL";
  if (highCount > 5 || inactiveCount > 10) return "ATTENTION";
  if (highCount > 0 || mediumCount > 0 || lowCount > 0 || inactiveCount > 0)
    return "GOOD";
  return "EXCELLENT";
}
