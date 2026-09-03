import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron Job para actualizar automáticamente el status de medidores
 *
 * Este endpoint se ejecuta periódicamente para:
 * 1. Marcar como INACTIVE medidores sin readings en 24h
 * 2. Marcar como ACTIVE medidores que vuelven a enviar datos
 * 3. Mantener consistencia entre BD y estado real
 */
export async function POST(request: Request) {
  try {
    // Verificar que sea una llamada autorizada (desde Vercel Cron)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    console.log(
      `[CRON] Iniciando actualización de status de medidores - ${now.toISOString()}`
    );

    // 1. Obtener medidores que deberían estar INACTIVE (sin readings en 24h)
    // Mechanical meters are excluded — their status is managed manually by users.
    const metersToDeactivate = await prisma.meter.findMany({
      where: {
        status: "ACTIVE",
        meter_type: "SMART",
        readings: {
          none: {
            timestamp: {
              gte: last24Hours,
            },
          },
        },
      },
      select: {
        id: true,
        dev_eui: true,
        device_name: true,
      },
    });

    // 2. Obtener medidores que deberían estar ACTIVE (con readings recientes)
    const metersToActivate = await prisma.meter.findMany({
      where: {
        status: "INACTIVE",
        meter_type: "SMART",
        readings: {
          some: {
            timestamp: {
              gte: last24Hours,
            },
          },
        },
      },
      select: {
        id: true,
        dev_eui: true,
        device_name: true,
      },
    });

    // 3. Actualizar medidores a INACTIVE
    let deactivatedCount = 0;
    if (metersToDeactivate.length > 0) {
      const deactivateResult = await prisma.meter.updateMany({
        where: {
          id: {
            in: metersToDeactivate.map((m) => m.id),
          },
        },
        data: {
          status: "INACTIVE",
          updated_at: now,
        },
      });
      deactivatedCount = deactivateResult.count;

      console.log(
        `[CRON] Desactivados ${deactivatedCount} medidores:`,
        metersToDeactivate.map((m) => m.dev_eui).join(", ")
      );
    }

    // 4. Actualizar medidores a ACTIVE
    let activatedCount = 0;
    if (metersToActivate.length > 0) {
      const activateResult = await prisma.meter.updateMany({
        where: {
          id: {
            in: metersToActivate.map((m) => m.id),
          },
        },
        data: {
          status: "ACTIVE",
          updated_at: now,
        },
      });
      activatedCount = activateResult.count;

      console.log(
        `[CRON] Reactivados ${activatedCount} medidores:`,
        metersToActivate.map((m) => m.dev_eui).join(", ")
      );
    }

    // 5. Obtener estadísticas finales
    const totalMeters = await prisma.meter.count();
    const activeMeters = await prisma.meter.count({
      where: { status: "ACTIVE" },
    });
    const inactiveMeters = await prisma.meter.count({
      where: { status: "INACTIVE" },
    });

    const response = {
      success: true,
      timestamp: now.toISOString(),
      summary: {
        totalMeters,
        activeMeters,
        inactiveMeters,
        deactivatedCount,
        activatedCount,
        netChange: activatedCount - deactivatedCount,
      },
      details: {
        metersToDeactivate: metersToDeactivate.map((m) => ({
          id: m.id,
          dev_eui: m.dev_eui,
          device_name: m.device_name,
        })),
        metersToActivate: metersToActivate.map((m) => ({
          id: m.id,
          dev_eui: m.dev_eui,
          device_name: m.device_name,
        })),
      },
    };

    console.log(`[CRON] Actualización completada:`, response.summary);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[CRON] Error actualizando status de medidores:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update meter status",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Endpoint GET para verificar el estado del cron job
 * Útil para debugging y monitoreo
 */
export async function GET() {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Obtener estadísticas actuales
    const stats = await prisma.$transaction(async (tx) => {
      const totalMeters = await tx.meter.count();
      const activeMeters = await tx.meter.count({
        where: { status: "ACTIVE" },
      });
      const inactiveMeters = await tx.meter.count({
        where: { status: "INACTIVE" },
      });
      const maintenanceMeters = await tx.meter.count({
        where: { status: "MAINTENANCE" },
      });
      const faultyMeters = await tx.meter.count({
        where: { status: "FAULTY" },
      });

      // Smart meters that should be inactive but aren't (mechanical excluded)
      const shouldBeInactive = await tx.meter.count({
        where: {
          status: "ACTIVE",
          meter_type: "SMART",
          readings: {
            none: {
              timestamp: {
                gte: last24Hours,
              },
            },
          },
        },
      });

      // Smart meters that should be active but aren't (mechanical excluded)
      const shouldBeActive = await tx.meter.count({
        where: {
          status: "INACTIVE",
          meter_type: "SMART",
          readings: {
            some: {
              timestamp: {
                gte: last24Hours,
              },
            },
          },
        },
      });

      return {
        totalMeters,
        activeMeters,
        inactiveMeters,
        maintenanceMeters,
        faultyMeters,
        inconsistencies: {
          shouldBeInactive,
          shouldBeActive,
          totalInconsistencies: shouldBeInactive + shouldBeActive,
        },
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      stats,
      last24HoursThreshold: last24Hours.toISOString(),
    });
  } catch (error) {
    console.error("[CRON] Error obteniendo estadísticas:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get cron statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
