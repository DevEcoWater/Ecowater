import { NextResponse } from "next/server";
import { getServerSession, Session } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/authOptions";
import { prisma } from "@/lib/prisma";

type AuthorizeResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/**
 * Gate para acciones irreversibles (borrados): exige sesión de admin con
 * permiso de escritura y que reingrese su propia contraseña.
 */
export async function authorizeDestructiveAction(
  password: string | null | undefined
): Promise<AuthorizeResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };
  }
  if (session.user.role !== "admin" || !session.user.canWrite) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Solo un administrador con permiso de escritura puede eliminar" },
        { status: 403 }
      ),
    };
  }

  if (!password) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Datos de confirmación incompletos" }, { status: 400 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { ok: false, response: NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 }) };
  }

  return { ok: true, session };
}
