import type {
  ValveCommandType,
  ValveDisplayStatus,
  ValveHistoryItem,
} from "@/types/meters/valve-types";

/**
 * Pasadas 3 ventanas de reporte (12 h cada una) sin que el medidor refleje el
 * comando, deja de mostrarse como "en curso": a esa altura lo mas probable es
 * que se haya perdido, y eso lo trata la deteccion de comandos perdidos, no
 * este cartel.
 */
export const PENDING_MAX_AGE_MS = 36 * 60 * 60 * 1000;

/**
 * Comando que sigue esperando al medidor, calculado desde la auditoria.
 *
 * Vive en la base y no en el navegador: sobrevive a recargar la pagina y se ve
 * igual desde cualquier sesion. Esta pendiente si el ultimo comando salio bien
 * y el estado reportado por el medidor todavia no es el que se pidio.
 */
export function resolvePendingCommand(
  latest: Pick<ValveHistoryItem, "action" | "result" | "timestamp"> | undefined,
  valveStatus: ValveDisplayStatus,
  now: number = Date.now()
): { command: ValveCommandType; sentAt: string } | null {
  if (!latest || latest.result !== "SENT") return null;

  const command: ValveCommandType =
    latest.action === "VALVE_OPEN" ? "OPEN" : "CLOSE";
  const reached =
    (command === "OPEN" && valveStatus === "OPEN") ||
    (command === "CLOSE" && valveStatus === "CLOSED");
  if (reached) return null;

  if (now - new Date(latest.timestamp).getTime() > PENDING_MAX_AGE_MS) {
    return null;
  }
  return { command, sentAt: latest.timestamp };
}

/**
 * Ultimo comando que salio bien pero el medidor nunca reflejo, y ya paso el
 * tiempo en que se lo consideraba "en curso". Es el caso en que probablemente
 * se perdio: mejor decirlo que dejar un "Enviado" que nadie confirmo.
 */
export function resolveUnconfirmedCommand(
  latest: Pick<ValveHistoryItem, "action" | "result" | "timestamp"> | undefined,
  valveStatus: ValveDisplayStatus,
  now: number = Date.now()
): { command: ValveCommandType; sentAt: string } | null {
  if (!latest || latest.result !== "SENT") return null;
  const command: ValveCommandType =
    latest.action === "VALVE_OPEN" ? "OPEN" : "CLOSE";
  const reached =
    (command === "OPEN" && valveStatus === "OPEN") ||
    (command === "CLOSE" && valveStatus === "CLOSED");
  if (reached) return null;
  if (now - new Date(latest.timestamp).getTime() <= PENDING_MAX_AGE_MS) {
    return null;
  }
  return { command, sentAt: latest.timestamp };
}
