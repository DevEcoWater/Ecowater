// app/api/user/[id]/route.ts
import { PrismaClient, UserStatus } from "@prisma/client";
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
        adress: true,
      },
    });

    const role = await prisma.userRole.findFirst({
      where: { user_id: params.id },
      select: {
        role: {
          select: {
            role_name: true,
          },
        },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Add role_name to the user object
    const result = {
      ...user,
      role: role?.role?.role_name ?? null,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET USER]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, status } = body;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email,
        password,
        status: status as UserStatus,
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
    await prisma.user.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("[DEACTIVATE USER]", error);
    return NextResponse.json(
      { error: "Failed to deactivate user" },
      { status: 400 }
    );
  }
}
