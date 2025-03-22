// app/api/user/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
export async function GET(req: Request) {
  try {
    const { page, limit, skip } = getPaginationParams({ url: req.url });

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          userRoles: true,
          userMeters: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET USERS WITH PAGINATION]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        address: body.address,
        status: "ACTIVE",
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.userRole.create({
      data: { user_id: user.id, role_id: body.role_id },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST USER]", error);
    return NextResponse.json(
      { error: "Failed to create user", description: error.message },
      { status: 400 }
    );
  }
}
