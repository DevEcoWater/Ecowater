import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[URGENCIES SIMPLE] Iniciando...");

    // Datos mock para probar
    const mockData = {
      alerts: {
        critical: [
          {
            type: "CRITICAL_METER",
            priority: "HIGH",
            meter: {
              id: "meter-1",
              device_name: "Medidor Principal",
              status: "FAULTY",
              operational_status: "ERROR",
            },
            user: {
              name: "Juan Pérez",
              address: "Calle Principal 123",
            },
            lastReading: {
              timestamp: "2025-08-21T10:00:00Z",
              flow: 0.0,
              temperature: 25.0,
            },
          },
        ],
        alarms: [
          {
            type: "ALARM",
            priority: "MEDIUM",
            reading: {
              id: "reading-1",
              timestamp: "2025-08-21T09:30:00Z",
              alarm_status: "HIGH_FLOW",
              error_code: "E001",
            },
            meter: {
              id: "meter-2",
              device_name: "Medidor Secundario",
              status: "ACTIVE",
            },
            user: {
              name: "María García",
              address: "Avenida Central 456",
            },
          },
        ],
        inactive: [
          {
            type: "INACTIVE_METER",
            priority: "LOW",
            meter: {
              id: "meter-3",
              device_name: "Medidor Inactivo",
              status: "INACTIVE",
            },
            user: {
              name: "Carlos López",
              address: "Plaza Mayor 789",
            },
            lastActivity: "Más de 24 horas",
          },
        ],
      },
      urgencyMetrics: {
        totalAlerts: 3,
        criticalCount: 1,
        alarmCount: 1,
        inactiveCount: 1,
        usersAffected: 3,
        systemHealth: "ATTENTION",
      },
      usersWithProblems: [
        {
          id: "user-1",
          name: "Juan Pérez",
          email: "juan@example.com",
          address: "Calle Principal 123",
          problemMeters: 1,
        },
        {
          id: "user-2",
          name: "María García",
          email: "maria@example.com",
          address: "Avenida Central 456",
          problemMeters: 1,
        },
        {
          id: "user-3",
          name: "Carlos López",
          email: "carlos@example.com",
          address: "Plaza Mayor 789",
          problemMeters: 1,
        },
      ],
    };

    console.log("[URGENCIES SIMPLE] Datos mock preparados");
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("[URGENCIES SIMPLE] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch urgency information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
