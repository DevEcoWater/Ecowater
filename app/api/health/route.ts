import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        checks: {
          database: "error",
        },
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
