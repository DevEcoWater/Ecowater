import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { canEditDashboard } from "@/lib/auth/roles";

/**
 * Para endpoints que modifican datos del dashboard: devuelve la respuesta de
 * error (401/403) si la sesión no puede editar, o null si puede seguir.
 */
export async function requireEditor(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!canEditDashboard(session.user.role)) {
    return NextResponse.json(
      { error: "Tu rol solo permite ver esta información" },
      { status: 403 }
    );
  }
  return null;
}
