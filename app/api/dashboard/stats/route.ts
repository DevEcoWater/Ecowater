import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log("[DASHBOARD STATS] Iniciando consulta...");

    // Verificar conexión a la base de datos
    try {
      await prisma.$connect();
      console.log("[DASHBOARD STATS] Conexión a BD exitosa");
    } catch (connectionError) {
      console.error("[DASHBOARD STATS] Error de conexión:", connectionError);
      return NextResponse.json(
        { error: "Database connection failed", details: connectionError },
        { status: 500 }
      );
    }

    // Obtener conteos totales uno por uno para identificar cuál falla
    let totalUsers = 0;
    let totalMeters = 0;
    let totalCooperatives = 0;
    let totalReadings = 0;

    try {
      totalUsers = await prisma.user.count();
      console.log("[DASHBOARD STATS] Usuarios contados:", totalUsers);
    } catch (error) {
      console.error("[DASHBOARD STATS] Error contando usuarios:", error);
      totalUsers = 0;
    }

    try {
      totalMeters = await prisma.meter.count();
      console.log("[DASHBOARD STATS] Medidores contados:", totalMeters);
    } catch (error) {
      console.error("[DASHBOARD STATS] Error contando medidores:", error);
      totalMeters = 0;
    }

    try {
      totalCooperatives = await prisma.cooperative.count();
      console.log(
        "[DASHBOARD STATS] Cooperativas contadas:",
        totalCooperatives
      );
    } catch (error) {
      console.error("[DASHBOARD STATS] Error contando cooperativas:", error);
      totalCooperatives = 0;
    }

    try {
      totalReadings = await prisma.reading.count();
      console.log("[DASHBOARD STATS] Lecturas contadas:", totalReadings);
    } catch (error) {
      console.error("[DASHBOARD STATS] Error contando lecturas:", error);
      totalReadings = 0;
    }

    // Obtener lecturas recientes (últimas 24 horas)
    let recentReadings = 0;
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      recentReadings = await prisma.reading.count({
        where: {
          timestamp: {
            gte: yesterday,
          },
        },
      });
      console.log(
        "[DASHBOARD STATS] Lecturas recientes contadas:",
        recentReadings
      );
    } catch (error) {
      console.error(
        "[DASHBOARD STATS] Error contando lecturas recientes:",
        error
      );
      recentReadings = 0;
    }

    // Obtener medidores con problemas
    let problematicMeters = 0;
    try {
      problematicMeters = await prisma.meter.count({
        where: {
          OR: [
            { status: "FAULTY" },
            { operational_status: "NEEDS_MAINTENANCE" },
          ],
        },
      });
      console.log(
        "[DASHBOARD STATS] Medidores problemáticos contados:",
        problematicMeters
      );
    } catch (error) {
      console.error(
        "[DASHBOARD STATS] Error contando medidores problemáticos:",
        error
      );
      problematicMeters = 0;
    }

    // Obtener cooperativas activas
    let activeCooperatives = 0;
    try {
      activeCooperatives = await prisma.cooperative.count({
        where: {
          status: "ACTIVE",
        },
      });
      console.log(
        "[DASHBOARD STATS] Cooperativas activas contadas:",
        activeCooperatives
      );
    } catch (error) {
      console.error(
        "[DASHBOARD STATS] Error contando cooperativas activas:",
        error
      );
      activeCooperatives = 0;
    }

    // Por ahora, usar valores por defecto para los estados
    const userCounts = {
      total: totalUsers,
      active: totalUsers, // Por ahora asumimos que todos están activos
      inactive: 0,
      pending: 0,
      blocked: 0,
    };

    const meterCounts = {
      total: totalMeters,
      active: totalMeters - problematicMeters, // Medidores totales menos los problemáticos
      inactive: 0,
      maintenance: 0,
      faulty: problematicMeters,
    };

    const response = {
      users: userCounts,
      meters: meterCounts,
      cooperatives: {
        total: totalCooperatives,
        active: activeCooperatives,
        inactive: totalCooperatives - activeCooperatives,
      },
      readings: {
        total: totalReadings,
        recent: recentReadings,
      },
      alerts: {
        problematicMeters,
        totalAlerts: problematicMeters,
      },
      summary: {
        totalEntities: totalUsers + totalMeters + totalCooperatives,
        systemHealth:
          problematicMeters === 0
            ? "EXCELLENT"
            : problematicMeters < 5
            ? "GOOD"
            : "ATTENTION",
      },
    };

    console.log("[DASHBOARD STATS] Respuesta preparada:", response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[DASHBOARD STATS] Error general:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard statistics",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log("[DASHBOARD STATS] Conexión cerrada");
    } catch (error) {
      console.error("[DASHBOARD STATS] Error cerrando conexión:", error);
    }
  }
}
