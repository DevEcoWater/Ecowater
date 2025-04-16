import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { meter_id, user_id } = body;

    const result = await prisma.userMeter.create({
      data: {
        meter_id,
        user_id,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[POST USER]", error);
    return NextResponse.json(
      {
        error: "Failed to create user",
        description: error.message,
      },
      { status: 400 }
    );
  }
}
