// app/api/cooperative/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const cooperative = await prisma.cooperative.findFirstOrThrow();

  return NextResponse.json(cooperative);
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const existing = await prisma.cooperative.findFirstOrThrow();
    const updated = await prisma.cooperative.update({
      where: { id: existing.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE COOPERATIVE]", error);
    return NextResponse.json(
      { error: "Failed to update cooperative" },
      { status: 400 }
    );
  }
}
