// app/api/cooperative/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET() {
  const cooperatives = await prisma.cooperative.findFirstOrThrow();
  return NextResponse.json(cooperatives);
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const existing = await prisma.cooperative.findFirst();

    if (!existing) {
      return NextResponse.json(
        { error: "No cooperative found to update" },
        { status: 404 }
      );
    }

    const updated = await prisma.cooperative.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update cooperative" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
