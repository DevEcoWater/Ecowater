// app/api/meter/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { MeterStatus, MeterType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { computeChipStatus } from "@/utils/meterConnectivity";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      device_name,
      meter_type,
      street_address,
      dev_eui,
      application_id,
      application_name,
      lat,
      lng,
      status,
      operational_status,
      user_id,
    } = body;

    const meter = await prisma.meter.create({
      data: {
        device_name,
        meter_type: (meter_type as MeterType) ?? "SMART",
        street_address: street_address ?? null,
        dev_eui: meter_type === "MECHANICAL" ? null : dev_eui,
        application_id: meter_type === "MECHANICAL" ? null : application_id,
        application_name: meter_type === "MECHANICAL" ? null : application_name,
        lat: lat ?? null,
        lng: lng ?? null,
        // Mechanical meters start INACTIVE — they have no LoRa radio and need a user assigned
        // before an admin can activate them. SMART meters default to ACTIVE.
        status: status ?? (meter_type === "MECHANICAL" ? "INACTIVE" : "ACTIVE"),
        operational_status: operational_status ?? "OPERATIONAL",
      },
    });

    // Assign user if provided
    if (user_id) {
      await prisma.userMeter.create({
        data: { user_id, meter_id: meter.id },
      });
    }

    return NextResponse.json(meter, { status: 201 });
  } catch (error) {
    console.error("[POST METER]", error);
    return NextResponse.json(
      { error: "Failed to create meter" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { page, limit, search, status } = getPaginationParams({
      url: req.url,
    });

    const url = new URL(req.url);
    const typeFilter = url.searchParams.get("type");

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

    if (typeFilter && (typeFilter === "SMART" || typeFilter === "MECHANICAL")) {
      where.meter_type = typeFilter as MeterType;
    }

    // Counts query excludes the status filter so all tab badges remain visible
    // regardless of the active status filter (search + type still apply).
    const { status: _statusFilter, ...whereForCounts } = where;

    // query meters + total + per-status counts in parallel
    const [rawMeters, total, statusGroups] = await Promise.all([
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
      prisma.meter.groupBy({
        by: ["status"],
        where: whereForCounts,
        _count: true,
      }),
    ]);

    const meters = rawMeters.map(({ userMeters, readings, ...meter }) => {
      const userMeter = userMeters[0];
      const lastReading = readings[0];

      // Connectivity status and chip status via shared helper
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      const isValidTimestamp =
        lastReading && lastReading.timestamp <= oneHourFromNow;
      const isActive =
        isValidTimestamp && lastReading && lastReading.timestamp >= last24Hours;

      // Mechanical meters have no LoRa radio — connectivity is always N/A.
      const isMechanical = meter.meter_type === "MECHANICAL";
      const connectivityStatus = isMechanical
        ? "N/A"
        : isActive
        ? "ONLINE"
        : lastReading
        ? "STALE"
        : "OFFLINE";
      const chipStatus = computeChipStatus(meter.meter_type, meter.status, lastReading);

      if (!userMeter) {
        return {
          ...meter,
          userMeter: null,
          lastReading: lastReading
            ? {
                value: lastReading.instantaneous_flow,
                cumulative: lastReading.cumulative_flow,
                consumption: lastReading.consumption,
                timestamp: lastReading.timestamp,
              }
            : null,
          connectivity: {
            status: connectivityStatus,
            lastSeen: isMechanical ? null : (lastReading?.timestamp || null),
            signalQuality: isMechanical ? "UNKNOWN" : isActive ? "EXCELLENT" : "UNKNOWN",
          },
          dataFreshness: {
            isRecent: isMechanical ? false : isActive,
            // Mechanical meters don't auto-report — stale data is expected, not a warning.
            warning:
              !isMechanical && !isActive && lastReading
                ? "Medidor sin actividad reciente"
                : null,
          },
          // Mecánicos usan estado real de BD; inteligentes usan conectividad
          status: (isMechanical ? meter.status : chipStatus) as MeterStatus,
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
        lastReading: lastReading
          ? {
              value: lastReading.instantaneous_flow,
              cumulative: lastReading.cumulative_flow,
              consumption: lastReading.consumption,
              timestamp: lastReading.timestamp,
            }
          : null,
        connectivity: {
          status: connectivityStatus,
          lastSeen: isMechanical ? null : (lastReading?.timestamp || null),
          signalQuality: isMechanical ? "UNKNOWN" : isActive ? "EXCELLENT" : "UNKNOWN",
        },
        dataFreshness: {
          isRecent: isMechanical ? false : isActive,
          // Mechanical meters don't auto-report — stale data is expected, not a warning.
          warning:
            !isMechanical && !isActive && lastReading ? "Medidor sin actividad reciente" : null,
        },
        // Mecánicos usan estado real de BD; inteligentes usan conectividad
        status: (isMechanical ? meter.status : chipStatus) as MeterStatus,
      };
    });

    // Build counts from DB groupBy — correct totals across all pages,
    // both SMART and MECHANICAL meters included by their DB status column.
    const countByStatus: Partial<Record<MeterStatus, number>> = Object.fromEntries(
      statusGroups.map((g) => [g.status, g._count])
    );
    const counts = {
      actives: countByStatus["ACTIVE"] ?? 0,
      inactives: countByStatus["INACTIVE"] ?? 0,
      maintenances: countByStatus["MAINTENANCE"] ?? 0,
      faultys: countByStatus["FAULTY"] ?? 0,
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
