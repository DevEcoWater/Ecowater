// app/api/user/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import bcrypt from "bcryptjs";
import { parseUserStatus } from "@/utils/parseUserStatus";
import { PaginatedUserResponse } from "@/types/users/user-types";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { page, limit, search, status } = getPaginationParams({
      url: req.url,
    });

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "total") {
      where.status = parseUserStatus(status);
    }

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userRoles: { include: { role: true } },
          userMeters: true,
          address: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithRoles = rawUsers.map(({ userRoles, ...user }) => ({
      ...user,
      role: userRoles[0]?.role.role_name ?? "Unknown",
    }));

    // counts per status (respecting same search filter if applied)
    const counts = {
      actives: await prisma.user.count({
        where: { ...where, status: "ACTIVE" },
      }),
      inactives: await prisma.user.count({
        where: { ...where, status: "INACTIVE" },
      }),
      pendings: await prisma.user.count({
        where: { ...where, status: "PENDING" },
      }),
      blockeds: await prisma.user.count({
        where: { ...where, status: "BLOCKED" },
      }),
    };

    return NextResponse.json<PaginatedUserResponse>({
      data: usersWithRoles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      counts,
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
      address: { data, lat, lng, shortData },
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const createdAddress = await tx.address.create({
        data: {
          data,
          shortData,
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
          addressId: createdAddress.id,
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

    const { password: _, ...newResult } = result;
    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: newResult,
      },
      { status: 201 }
    );
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
