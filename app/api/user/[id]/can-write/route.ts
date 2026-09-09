export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { z } from "zod";

const schema = z.object({ canWrite: z.boolean() });

type Context = { params: { id: string } };

export async function PATCH(req: Request, { params }: Context) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: "No podés modificar tu propio permiso de escritura" },
        { status: 422 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { can_write: parsed.data.canWrite },
      select: { id: true, email: true, can_write: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[CAN-WRITE PATCH]", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
