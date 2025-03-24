// app/api/cooperative/[id]/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const coop = await prisma.cooperative.findUnique({
    where: { id: params.id },
  });
  return NextResponse.json(coop);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const data = await req.json();
  const updated = await prisma.cooperative.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await prisma.cooperative.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
