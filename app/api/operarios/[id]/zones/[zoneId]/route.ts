import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type Context = { params: { id: string; zoneId: string } };

// DELETE /api/operarios/[id]/zones/[zoneId] — remove zone assignment
export async function DELETE(_: Request, { params }: Context) {
  try {
    await prisma.zoneOperator.deleteMany({
      where: { user_id: params.id, zone_id: params.zoneId },
    });
    return NextResponse.json({ message: "Asignación eliminada" });
  } catch (error) {
    console.error("[DELETE OPERARIO ZONE]", error);
    return NextResponse.json({ error: "Failed to remove zone assignment" }, { status: 500 });
  }
}
