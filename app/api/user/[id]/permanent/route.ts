export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeDestructiveAction } from "@/lib/auth/authorize-destructive-action";

type Context = { params: { id: string } };

const schema = z.object({
  password: z.string().min(1),
  confirmEmail: z.string().min(1),
});

/**
 * Borrado definitivo de un usuario (DELETE /api/user/[id] solo lo desactiva).
 * Roles, medidores asignados y zonas de operario caen por cascade; las lecturas
 * que cargó quedan sin autor y la auditoría de válvulas se conserva.
 */
export async function DELETE(req: Request, { params }: Context) {
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    const auth = await authorizeDestructiveAction(parsed.success ? parsed.data.password : null);
    if ("response" in auth) return auth.response;
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos de confirmación incompletos" }, { status: 400 });
    }
    const { session } = auth;

    if (session.user.id === params.id) {
      return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 422 });
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        email: true,
        addressId: true,
        userRoles: { select: { role: { select: { role_name: true } } } },
      },
    });
    if (!target) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (parsed.data.confirmEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
      return NextResponse.json(
        { error: "El email ingresado no coincide con el del usuario" },
        { status: 400 }
      );
    }

    const isTargetAdmin = target.userRoles.some((ur) => ur.role.role_name === "admin");
    if (isTargetAdmin) {
      const adminCount = await prisma.user.count({
        where: { userRoles: { some: { role: { role_name: "admin" } } } },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar al último administrador" },
          { status: 422 }
        );
      }
    }

    await prisma.$transaction([
      prisma.reading.updateMany({
        where: { submitted_by: params.id },
        data: { submitted_by: null },
      }),
      prisma.user.delete({ where: { id: params.id } }),
      prisma.address.delete({ where: { id: target.addressId } }),
    ]);

    console.warn(`[DELETE USER] ${params.id} (${target.email}) eliminado por ${session.user.email}`);
    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("[DELETE USER]", error);
    return NextResponse.json({ error: "No se pudo eliminar el usuario" }, { status: 500 });
  }
}
