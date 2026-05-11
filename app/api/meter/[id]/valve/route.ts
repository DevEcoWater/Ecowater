export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { publishValveCommand, VALVE_TOPICS } from "@/lib/mqtt-client";
import { saveValveEvent, getValveHistory } from "@/lib/mongo-audit";
import { z } from "zod";

const commandSchema = z.object({
  command: z.enum(["OPEN", "CLOSE"]),
});

type Context = { params: { id: string } };

export async function POST(req: Request, { params }: Context) {
  const prisma = new PrismaClient();
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
    if (!session.user.canWrite) {
      return NextResponse.json(
        { error: "Permiso de escritura no habilitado" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = commandSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Comando inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { command } = parsed.data;

    const meter = await prisma.meter.findUnique({ where: { id: params.id } });
    if (!meter) {
      return NextResponse.json(
        { error: "Medidor no encontrado" },
        { status: 404 }
      );
    }
    if (meter.meter_type !== "SMART") {
      return NextResponse.json(
        { error: "Control de válvula solo disponible para medidores inteligentes" },
        { status: 422 }
      );
    }
    if (!meter.dev_eui) {
      return NextResponse.json(
        { error: "Medidor sin dev_eui configurado" },
        { status: 422 }
      );
    }

    let mqttError: string | null = null;
    try {
      await publishValveCommand(command);
    } catch (err) {
      mqttError =
        err instanceof Error ? err.message : "Error desconocido de MQTT";
    }

    const topic = VALVE_TOPICS[command];

    await saveValveEvent({
      timestamp: new Date(),
      user_id: session.user.id,
      user_email: session.user.email!,
      action: command === "OPEN" ? "VALVE_OPEN" : "VALVE_CLOSE",
      meter_id: params.id,
      dev_eui: meter.dev_eui,
      mqtt_topic: topic,
      result: mqttError ? "FAILED" : "SENT",
      error: mqttError,
    });

    if (mqttError) {
      return NextResponse.json(
        { error: `Fallo al publicar comando MQTT: ${mqttError}`, topic, action: command },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, topic, action: command },
      { status: 201 }
    );
  } catch (err) {
    console.error("[VALVE POST]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(req: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10"))
    );

    const result = await getValveHistory(params.id, page, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[VALVE GET]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
