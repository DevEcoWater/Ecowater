// app/api/user/[id]/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

type Context = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, { params }: Context) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userRoles: true,
        userMeters: true,
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET USER]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const body = await req.json();

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        username: body.username,
        email: body.email,
        password: body.password,
        address: body.address,
        status: body.status,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PUT USER]", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: Context) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("[DELETE USER]", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 400 }
    );
  }
}
