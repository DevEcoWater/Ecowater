import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(_: Request, { params }: Context) {
  try {
    await prisma.user.update({
      where: { id: params.id },
      data: { status: "ACTIVE" },
    });

    return NextResponse.json({ message: "User reactivated successfully" });
  } catch (error) {
    console.error("[REACTIVATE USER]", error);
    return NextResponse.json(
      { error: "Failed to reactivate user" },
      { status: 400 }
    );
  }
}
