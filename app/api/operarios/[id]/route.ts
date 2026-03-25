import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type Context = { params: { id: string } };

export async function GET(_: Request, { params }: Context) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userRoles: { include: { role: true } },
        zoneOperators: { include: { zone: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Operario no encontrado" }, { status: 404 });
    }

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [readingsTotal, readingsThisWeek, lastReading] = await Promise.all([
      prisma.reading.count({ where: { submitted_by: params.id } }),
      prisma.reading.count({ where: { submitted_by: params.id, timestamp: { gte: weekStart } } }),
      prisma.reading.findFirst({
        where: { submitted_by: params.id },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
    ]);

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      role: user.userRoles[0]?.role.role_name ?? "operario",
      created_at: user.created_at,
      readings_total: readingsTotal,
      readings_this_week: readingsThisWeek,
      last_reading_at: lastReading?.timestamp ?? null,
      assignedZones: user.zoneOperators.map((zo) => ({
        id: zo.zone.id,
        name: zo.zone.name,
        color: zo.zone.color,
        status: zo.zone.status,
      })),
    });
  } catch (error) {
    console.error("[GET OPERARIO]", error);
    return NextResponse.json({ error: "Failed to fetch operario" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, status } = body;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { firstName, lastName, email, status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT OPERARIO]", error);
    return NextResponse.json({ error: "Failed to update operario" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    await prisma.user.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });
    return NextResponse.json({ message: "Operario desactivado" });
  } catch (error) {
    console.error("[DELETE OPERARIO]", error);
    return NextResponse.json({ error: "Failed to deactivate operario" }, { status: 400 });
  }
}
