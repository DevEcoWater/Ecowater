import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const downloads = await prisma.zoneDownload.findMany({
      where: { zone_id: params.id },
      orderBy: { downloaded_at: "desc" },
    });
    return NextResponse.json(downloads);
  } catch (e) {
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { period_start, period_end, meter_count, notes } = body;

    if (!period_start || !period_end || meter_count == null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 },
      );
    }

    const download = await prisma.zoneDownload.create({
      data: {
        zone_id: params.id,
        period_start: new Date(period_start),
        period_end: new Date(period_end),
        meter_count: Number(meter_count),
        notes: notes ?? null,
      },
    });

    return NextResponse.json(download, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: "Error al registrar descarga" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const { download_id, period_start, period_end, notes } = body;

    if (!download_id) {
      return NextResponse.json({ error: "Falta download_id" }, { status: 400 });
    }

    const updated = await prisma.zoneDownload.update({
      where: { id: download_id },
      data: {
        ...(period_start && { period_start: new Date(period_start) }),
        ...(period_end && { period_end: new Date(period_end) }),
        notes: notes ?? null,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: "Error al actualizar descarga" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
