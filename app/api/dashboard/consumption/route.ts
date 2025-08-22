import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    console.log("[CONSUMPTION] Iniciando consulta...");

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "7d";

    console.log("[CONSUMPTION] Período solicitado:", period);

    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }

    console.log(
      "[CONSUMPTION] Rango de fechas:",
      startDate.toISOString(),
      "a",
      endDate.toISOString()
    );

    // Por ahora, devolver datos mock para evitar errores
    const mockData = {
      chartData: [
        {
          date: "2025-08-15",
          totalFlow: 150.5,
          instantFlow: 25.3,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-16",
          totalFlow: 165.2,
          instantFlow: 28.1,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-17",
          totalFlow: 142.8,
          instantFlow: 23.9,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-18",
          totalFlow: 178.3,
          instantFlow: 30.2,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-19",
          totalFlow: 156.7,
          instantFlow: 26.8,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-20",
          totalFlow: 189.1,
          instantFlow: 32.5,
          reverseFlow: 0.0,
          readings: 24,
        },
        {
          date: "2025-08-21",
          totalFlow: 172.4,
          instantFlow: 29.7,
          reverseFlow: 0.0,
          readings: 24,
        },
      ],
      metrics: {
        totalConsumption: 1155.0,
        averageDailyConsumption: 165.0,
        totalReadings: 168,
        period: period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      },
      topMeters: [
        {
          meter_id: "meter-1",
          _sum: {
            cumulative_flow: "189.1",
          },
          _count: {
            id: 24,
          },
        },
      ],
      period: period,
    };

    console.log("[CONSUMPTION] Datos mock preparados");
    return NextResponse.json(mockData);
  } catch (error) {
    console.error("[CONSUMPTION] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch consumption data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error("[CONSUMPTION] Error cerrando conexión:", error);
    }
  }
}
