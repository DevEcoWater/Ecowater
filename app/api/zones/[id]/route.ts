import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const zone = await prisma.zone.findUnique({ where: { id: params.id } });
    if (!zone) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    return NextResponse.json(zone);
  } catch (error) {
    console.error("[GET ZONE]", error);
    return NextResponse.json({ error: "Error al obtener zona" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, color, polygon } = body;

    const zone = await prisma.zone.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
        ...(polygon !== undefined && { polygon }),
      },
    });

    return NextResponse.json(zone);
  } catch (error) {
    console.error("[PUT ZONE]", error);
    return NextResponse.json({ error: "Error al actualizar zona" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.zone.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE ZONE]", error);
    return NextResponse.json({ error: "Error al eliminar zona" }, { status: 500 });
  }
}
