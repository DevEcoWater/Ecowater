import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";
import type { CircuitResponse } from "@/types/zones/circuit-types";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

const saveCircuitSchema = z.object({
  entries: z.array(
    z.object({
      meterId: z.string().min(1),
      order: z.number().int().min(1),
      assignedOperatorId: z.string().nullable(),
    })
  ),
});

async function buildCircuitResponse(zoneId: string): Promise<CircuitResponse> {
  const [circuitRows, zoneWithOperators] = await Promise.all([
    prisma.meterCircuit.findMany({
      where: { zone_id: zoneId },
      orderBy: { order: "asc" },
      include: {
        meter: { select: { device_name: true, street_address: true, lat: true, lng: true } },
        assignedOperator: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.zone.findUnique({
      where: { id: zoneId },
      select: {
        zoneOperators: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    }),
  ]);

  const zoneOperatorIds = new Set(
    zoneWithOperators?.zoneOperators.map((zo) => zo.user_id) ?? []
  );

  return {
    zoneId,
    exists: circuitRows.length > 0,
    entries: circuitRows.map((row) => ({
      id: row.id,
      meterId: row.meter_id,
      order: row.order,
      assignedOperatorId:
        row.assigned_operator_id && zoneOperatorIds.has(row.assigned_operator_id)
          ? row.assigned_operator_id
          : null,
      device_name: row.meter.device_name,
      street_address: row.meter.street_address,
      lat: row.meter.lat!,
      lng: row.meter.lng!,
    })),
    operators:
      zoneWithOperators?.zoneOperators.map((zo) => ({
        id: zo.user.id,
        firstName: zo.user.firstName,
        lastName: zo.user.lastName,
      })) ?? [],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    const response = await buildCircuitResponse(params.id);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET CIRCUIT]", error);
    return NextResponse.json({ error: "Error al obtener circuito" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) {
      return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = saveCircuitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { entries } = parsed.data;

    if (entries.length === 0) {
      await prisma.meterCircuit.deleteMany({ where: { zone_id: params.id } });
      const response = await buildCircuitResponse(params.id);
      return NextResponse.json(response);
    }

    // Validate no duplicate orders or meterIds
    const orders = entries.map((e) => e.order);
    const meterIds = entries.map((e) => e.meterId);
    if (new Set(orders).size !== orders.length || new Set(meterIds).size !== meterIds.length) {
      return NextResponse.json({ error: "Órdenes o medidores duplicados" }, { status: 400 });
    }

    // Validate all meters are MECHANICAL, have coordinates, and are inside the zone polygon
    const meters = await prisma.meter.findMany({
      where: { id: { in: meterIds } },
      select: { id: true, meter_type: true, lat: true, lng: true },
    });

    const polygon = zone.polygon as unknown as PolygonPoint[];

    for (const entry of entries) {
      const meter = meters.find((m) => m.id === entry.meterId);
      if (!meter) {
        return NextResponse.json({ error: `Medidor ${entry.meterId} no encontrado` }, { status: 400 });
      }
      if (meter.meter_type !== "MECHANICAL") {
        return NextResponse.json({ error: `Medidor ${entry.meterId} no es mecánico` }, { status: 400 });
      }
      if (meter.lat == null || meter.lng == null) {
        return NextResponse.json({ error: `Medidor ${entry.meterId} no tiene coordenadas` }, { status: 400 });
      }
      if (!pointInPolygon(meter.lat, meter.lng, polygon)) {
        return NextResponse.json({ error: `Medidor ${entry.meterId} no está dentro de la zona` }, { status: 400 });
      }
    }

    // Validate assigned operators belong to the zone
    const operatorIds = entries
      .map((e) => e.assignedOperatorId)
      .filter((id): id is string => id !== null);

    if (operatorIds.length > 0) {
      const zoneOperators = await prisma.zoneOperator.findMany({
        where: { zone_id: params.id, user_id: { in: operatorIds } },
        select: { user_id: true },
      });
      const validOperatorIds = new Set(zoneOperators.map((zo) => zo.user_id));
      for (const opId of operatorIds) {
        if (!validOperatorIds.has(opId)) {
          return NextResponse.json({ error: `Operario ${opId} no pertenece a la zona` }, { status: 400 });
        }
      }
    }

    // Bulk replace inside a transaction
    await prisma.$transaction([
      prisma.meterCircuit.deleteMany({ where: { zone_id: params.id } }),
      prisma.meterCircuit.createMany({
        data: entries.map((e) => ({
          zone_id: params.id,
          meter_id: e.meterId,
          order: e.order,
          assigned_operator_id: e.assignedOperatorId,
        })),
      }),
    ]);

    const response = await buildCircuitResponse(params.id);
    return NextResponse.json(response);
  } catch (error) {
    console.error("[PUT CIRCUIT]", error);
    return NextResponse.json({ error: "Error al guardar circuito" }, { status: 500 });
  }
}
