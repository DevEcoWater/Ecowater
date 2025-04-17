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
        adress: true,
        userMeters: {
          include: {
            meter: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Extract meters
    const meter = user.userMeters.map((um) => um.meter)[0] ?? null;

    // Extract role_name (assuming one role per user)
    const role = user.userRoles[0]?.role?.role_name ?? null;

    // Build final response
    const { userMeters, userRoles, ...rest } = user;

    const result = {
      ...rest,
      meter,
      role,
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
    const {
      firstName,
      lastName,
      email,
      password,
      status,
      address,
      coordinates,
    } = body;
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        email,
        ...(password && { password }),
        status: status as UserStatus,
        adress: {
          update: {
            address,
            lat: coordinates.lat.toString(),
            lng: coordinates.lng.toString(),
          },
        },
      },
      include: {
        adress: true,
      },
    });

    return NextResponse.json({
      ...updatedUser,
      address: updatedUser.adress.address,
      coordinates: {
        lat: parseFloat(updatedUser.adress.lat),
        lng: parseFloat(updatedUser.adress.lng),
      },
    });
  } catch (error) {
    console.error("[UPDATE USER]", error);
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
