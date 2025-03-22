// app/api/cooperative/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const prisma = new PrismaClient();
  const cooperatives = await prisma.cooperative.findMany();
  return NextResponse.json(cooperatives);
}
