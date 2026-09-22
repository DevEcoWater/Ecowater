import { prisma } from "@/lib/prisma";
import type { ValveAction, ValveResult } from "@prisma/client";

/**
 * Auditoría de comandos de válvula, en Postgres.
 *
 * Vivía en un cluster de Mongo Atlas que fue borrado sin que nadie se enterara,
 * dejando la función más sensible del sistema —quién le corta el agua a un
 * socio— sin registro alguno. Ahora usa la misma base que el resto de la app,
 * que ya está respaldada por deploy/scripts/backup-db.sh.
 */

export interface ValveEventInput {
  user_id: string;
  user_email: string;
  action: ValveAction;
  meter_id: string;
  dev_eui: string | null;
  mqtt_topic: string;
  result: ValveResult;
  error: string | null;
}

export async function saveValveEvent(event: ValveEventInput): Promise<void> {
  await prisma.valveEvent.create({
    data: { ...event, timestamp: new Date() },
  });
}

export interface ValveEventPage {
  data: {
    id: string;
    timestamp: Date;
    user_id: string;
    user_email: string;
    action: ValveAction;
    meter_id: string;
    dev_eui: string | null;
    mqtt_topic: string;
    result: ValveResult;
    error: string | null;
  }[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getValveHistory(
  meterId: string,
  page = 1,
  limit = 10
): Promise<ValveEventPage> {
  const where = { meter_id: meterId };

  const [data, total] = await Promise.all([
    prisma.valveEvent.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.valveEvent.count({ where }),
  ]);

  return {
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
