import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = { params: { id: string } };

// POST /api/operarios/[id]/zones — assign a zone to an operator
export async function POST(req: Request, { params }: Context) {
  try {
    const body = await req.json();
    const { zone_id } = body;

    if (!zone_id) {
      return NextResponse.json({ error: "zone_id es requerido" }, { status: 400 });
    }

    const zoneOperator = await prisma.zoneOperator.create({
      data: { zone_id, user_id: params.id },
      include: { zone: true },
    });

    return NextResponse.json(zoneOperator, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "El operario ya está asignado a esta zona" },
        { status: 409 }
      );
    }
    console.error("[POST OPERARIO ZONE]", error);
    return NextResponse.json({ error: "Failed to assign zone" }, { status: 500 });
  }
}
