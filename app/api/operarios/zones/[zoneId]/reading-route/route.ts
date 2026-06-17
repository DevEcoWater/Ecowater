import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/operarios/zones/[zoneId]/reading-route
// Returns MECHANICAL meters in the zone polygon with read status.
// Without period params: today's read_today / read_count (portal-compatible).
// With startDate + endDate: adds read_in_period, period_reading_date, completed, completed_at.
//
// Access control: if the session role is "operario", only meters assigned to that
// operator via route_assignments are returned. Admins see everything.
export async function GET(
  req: Request,
  { params }: { params: { zoneId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const callerRole = (session?.user as { role?: string } | undefined)?.role;
    const callerId = session?.user?.id ?? null;
    const isOperario = callerRole === "operario";

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const hasPeriod = !!(startDateParam && endDateParam);

    const zone = await prisma.zone.findUnique({
      where: { id: params.zoneId },
      include: {
        _count: { select: { zoneOperators: true } },
        zoneOperators: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    // Cast to access new nullable fields added to schema (route_order, route_assignments).
    // Until prisma generate runs, these are typed as Json/unknown on the generated client.
    const zoneAny = zone as typeof zone & {
      route_order?: unknown;
      route_assignments?: unknown;
    };

    const polygon = zone.polygon as unknown as PolygonPoint[];
    const routeOrder = (zoneAny.route_order as string[] | null) ?? null;
    const routeAssignments = (zoneAny.route_assignments as Record<string, string> | null) ?? null;
    const operatorCount = zone._count.zoneOperators;

    // Build operators list for the admin builder UI.
    const operators = zone.zoneOperators.map((zo) => ({
      id: zo.user.id,
      name: `${zo.user.firstName} ${zo.user.lastName}`.trim(),
    }));

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;
    if (hasPeriod) {
      periodStart = new Date(`${startDateParam}T00:00:00`);
      periodEnd = new Date(`${endDateParam}T23:59:59`);
    }

    const meters = await prisma.meter.findMany({
      where: {
        meter_type: "MECHANICAL",
        lat: { not: null },
        lng: { not: null },
      },
      include: {
        userMeters: {
          include: { user: { include: { address: true } } },
          orderBy: { assigned_at: "desc" },
          take: 1,
        },
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
      },
    });

    const allInZone = meters.filter((m) =>
      pointInPolygon(m.lat!, m.lng!, polygon)
    );
    const zoneTotal = allInZone.length;

    // If the caller is an operario, restrict to meters assigned to them.
    let inZone = allInZone;
    if (isOperario && callerId) {
      inZone = allInZone.filter(
        (m) => routeAssignments?.[m.id] === callerId
      );
    }

    // For period queries we need to check if there is a reading in the window.
    const periodReadingMap = new Map<string, Date | null>();
    if (hasPeriod && periodStart && periodEnd) {
      const meterIds = inZone.map((m) => m.id);
      const periodReadings = await prisma.reading.findMany({
        where: {
          meter_id: { in: meterIds },
          timestamp: { gte: periodStart, lte: periodEnd },
        },
        orderBy: { timestamp: "desc" },
        select: { meter_id: true, timestamp: true },
      });

      for (const r of periodReadings) {
        if (!periodReadingMap.has(r.meter_id)) {
          periodReadingMap.set(r.meter_id, r.timestamp);
        }
      }
      for (const m of inZone) {
        if (!periodReadingMap.has(m.id)) {
          periodReadingMap.set(m.id, null);
        }
      }
    }

    // Build route index for ordering.
    const routeIndexMap = new Map<string, number>();
    if (routeOrder) {
      routeOrder.forEach((id, idx) => routeIndexMap.set(id, idx));
    }

    // Sort: meters in route first (by route order), then remaining meters in stable order.
    const sortedInZone = [...inZone].sort((a, b) => {
      const aIdx = routeIndexMap.has(a.id) ? routeIndexMap.get(a.id)! : Infinity;
      const bIdx = routeIndexMap.has(b.id) ? routeIndexMap.get(b.id)! : Infinity;
      return aIdx - bIdx;
    });

    const route = sortedInZone.map((m) => {
      const user = m.userMeters[0]?.user ?? null;
      const lastReading = m.readings[0] ?? null;
      const read_today =
        lastReading != null && lastReading.timestamp >= todayStart;

      const routeIdx = routeIndexMap.get(m.id);
      const order = routeIdx !== undefined ? routeIdx + 1 : null;

      const base = {
        id: m.id,
        device_name: m.device_name,
        street_address: m.street_address ?? null,
        lat: m.lat,
        lng: m.lng,
        userName: user
          ? `${user.lastName ?? ""}, ${user.firstName ?? ""}`.trim()
          : null,
        userId: user?.id ?? null,
        last_reading_value: lastReading?.instantaneous_flow ?? null,
        last_reading_date: lastReading?.timestamp ?? null,
        read_today,
        reading_time_today: read_today ? lastReading?.timestamp : null,
        order,
        operator_id: routeAssignments?.[m.id] ?? null,
      };

      if (hasPeriod) {
        const periodReadingDate = periodReadingMap.get(m.id) ?? null;
        return {
          ...base,
          read_in_period: periodReadingDate !== null,
          period_reading_date: periodReadingDate,
        };
      }

      return base;
    });

    const responseBase = {
      zone: { id: zone.id, name: zone.name, color: zone.color },
      meters: route,
      total: route.length,
      zone_total: zoneTotal,
      read_count: route.filter((m) => m.read_today).length,
      operator_count: operatorCount,
      operators,
    };

    if (hasPeriod) {
      const allRead = route.every((m) => (m as { read_in_period?: boolean }).read_in_period);
      const completed = route.length > 0 && allRead;
      const periodDates = route
        .map((m) => (m as { period_reading_date?: Date | null }).period_reading_date)
        .filter((d): d is Date => d !== null);
      const completedAt =
        completed && periodDates.length > 0
          ? new Date(Math.max(...periodDates.map((d) => d.getTime()))).toISOString()
          : null;

      return NextResponse.json({
        ...responseBase,
        completed,
        completed_at: completedAt,
      });
    }

    return NextResponse.json(responseBase);
  } catch (error) {
    console.error("[GET READING ROUTE]", error);
    return NextResponse.json(
      { error: "Error al obtener ruta de lectura" },
      { status: 500 }
    );
  }
}
