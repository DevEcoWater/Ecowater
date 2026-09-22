export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";

// mqtt is optional infrastructure — loaded dynamically so that a missing
// package causes a graceful 5xx instead of crashing the route module.
// The audit lives in Postgres, so it rides on the same connection this route
// already needs: if the database is down, the meter lookup above fails and
// nothing is ever published. "No audit, no command" holds by construction.

const commandSchema = z.object({
  command: z.enum(["OPEN", "CLOSE"]),
});

type Context = { params: { id: string } };

const DEV_BYPASS = process.env.NODE_ENV !== "production" && process.env.VALVE_BYPASS_AUTH === "true";

export async function POST(req: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);

    if (!DEV_BYPASS) {
      if (!session?.user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
      if (!session.user.canWrite) {
        return NextResponse.json(
          { error: "Permiso de escritura no habilitado" },
          { status: 403 }
        );
      }
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

    // Sin fallback a propósito: el application_id es por medidor (conviven 1 y 3)
    // y adivinarlo publica en una application inexistente — el broker acepta el
    // mensaje igual y el comando se pierde sin error. Mejor fallar acá.
    if (!meter.application_id) {
      return NextResponse.json(
        { error: "Medidor sin application_id configurado" },
        { status: 422 }
      );
    }

    const appId = meter.application_id;

    const { getValveTopic, publishValveCommand, MqttBrokerError } = await import("@/lib/mqtt-client");
    const topic = getValveTopic(meter.dev_eui, appId);

    let mqttError: string | null = null;
    let mqttStatus: "SUCCESS" | "MQTT_ERROR" = "SUCCESS";
    try {
      await publishValveCommand(command, meter.dev_eui, appId);
    } catch (err) {
      mqttError = err instanceof Error ? err.message : "Error desconocido de MQTT";
      mqttStatus = err instanceof MqttBrokerError ? "MQTT_ERROR" : "MQTT_ERROR";
    }

    // El comando ya salio al broker: un fallo al registrarlo no puede
    // devolver 500, o el operador reintenta sobre una valvula ya accionada.
    let audit: "SAVED" | "FAILED" = "SAVED";
    try {
      const { saveValveEvent } = await import("@/lib/valve-audit");
      await saveValveEvent({
        user_id: session?.user?.id ?? "dev-bypass",
        user_email: session?.user?.email ?? "dev@bypass.local",
        action: command === "OPEN" ? "VALVE_OPEN" : "VALVE_CLOSE",
        meter_id: params.id,
        dev_eui: meter.dev_eui,
        mqtt_topic: topic,
        result: mqttError ? "FAILED" : "SENT",
        error: mqttError,
      });
    } catch (err) {
      audit = "FAILED";
      console.error("[VALVE AUDIT] no se pudo registrar el comando", {
        meter_id: params.id,
        dev_eui: meter.dev_eui,
        action: command,
        mqtt_result: mqttError ? "FAILED" : "SENT",
        err,
      });
    }

    if (mqttError) {
      return NextResponse.json(
        { error: `Fallo al publicar comando MQTT: ${mqttError}`, status: "MQTT_ERROR", topic, action: command, audit },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { success: true, status: "SUCCESS", topic, action: command, audit },
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

    if (!DEV_BYPASS) {
      if (!session?.user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      if (session.user.role !== "admin") {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10"))
    );

    const { getValveHistory } = await import("@/lib/valve-audit");
    const result = await getValveHistory(params.id, page, limit);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[VALVE GET]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
