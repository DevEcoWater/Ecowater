import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { ReadingAttemptPayload } from "@/types/portal/reading-attempt-types";

// POST /api/meter/[id]/reading-attempts
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const prisma = new PrismaClient();
  try {
    const meter = await prisma.meter.findUnique({ where: { id: params.id } });
    if (!meter) {
      return NextResponse.json(
        { error: "Medidor no encontrado" },
        { status: 404 }
      );
    }

    const body: ReadingAttemptPayload = await req.json();

    const attempt = await prisma.readingAttempt.create({
      data: {
        meter_id: params.id,
        success: body.success,
        image_path: body.image_path,
        value_detected: body.value_detected ?? null,
        error_message: body.error_message ?? null,
        submitted_by: body.submitted_by ?? null,
      },
    });

    return NextResponse.json(attempt, { status: 201 });
  } catch (err) {
    console.error("[reading-attempts] Error:", err);
    return NextResponse.json(
      { error: "Error al guardar el intento" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
