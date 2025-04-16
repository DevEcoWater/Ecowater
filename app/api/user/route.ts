// app/api/user/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
export async function GET(req: Request) {
  try {
    const { page, limit, skip } = getPaginationParams({ url: req.url });

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
          userMeters: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count(),
    ]);

    const users = rawUsers.map(({ userRoles, ...user }) => ({
      ...user,
      role: {
        id: userRoles[0].role.id,
        role_name: userRoles[0].role.role_name,
      },
    }));

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
    const {
      firstName,
      lastName,
      email,
      password,
      role_id,
      address_data: { address, lat, lng },
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const createdAddress = await tx.adress.create({
        data: {
          address,
          lat,
          lng,
        },
      });

      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          adressId: createdAddress.id,
          status: "ACTIVE",
        },
      });

      await tx.userRole.create({
        data: {
          user_id: user.id,
          role_id,
        },
      });

      return user;
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
