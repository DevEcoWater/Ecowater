// app/api/cooperative/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const cooperative = await prisma.cooperative.findFirstOrThrow();

  return NextResponse.json(cooperative);
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const existing = await prisma.cooperative.findFirstOrThrow();

    // Whitelist allowed fields — never pass raw body to Prisma
    const allowed = [
      "name",
      "location",
      "lat",
      "lng",
      "contact_person",
      "phone_number",
      "email",
      "website",
      "status",
      "logo_url",
      "primary_color",
    ] as const;

    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const updated = await prisma.cooperative.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH COOPERATIVE]", error);
    return NextResponse.json(
      { error: "Failed to update cooperative" },
      { status: 400 }
    );
  }
}
