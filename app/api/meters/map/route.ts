import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeChipStatus } from "@/utils/meterConnectivity";

export const dynamic = "force-dynamic";

/**
 * GET /api/meters/map
 *
 * Returns all meters that have coordinates, without pagination.
 * Includes valve_status (for smart meters) from the latest reading's Status record.
 * Used exclusively by the admin map view.
 */
export async function GET() {
  try {
    const rawMeters = await prisma.meter.findMany({
      where: {
        lat: { not: null },
        lng: { not: null },
      },
      select: {
        id: true,
        device_name: true,
        dev_eui: true,
        street_address: true,
        meter_type: true,
        status: true,
        updated_at: true,
        lat: true,
        lng: true,
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1,
          select: {
            timestamp: true,
            statuses: {
              take: 1,
              select: { valve_status: true },
            },
          },
        },
      },
    });

    const meters = rawMeters.map((m) => {
      const lastReading = m.readings[0] ?? null;
      const chipStatus = computeChipStatus(m.meter_type, m.status, lastReading);
      const valve_status =
        m.meter_type === "MECHANICAL"
          ? null
          : (lastReading?.statuses[0]?.valve_status ?? "unknown");

      const { readings, ...rest } = m;
      return {
        ...rest,
        status: chipStatus,
        valve_status,
        last_reading_at: lastReading?.timestamp ?? null,
      };
    });

    return NextResponse.json(meters);
  } catch (error) {
    console.error("[GET MAP METERS]", error);
    return NextResponse.json(
      { error: "Failed to fetch map meters" },
      { status: 500 }
    );
  }
}
