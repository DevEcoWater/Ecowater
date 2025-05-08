// app/api/user/route.ts
import { NextResponse } from "next/server";
import { getPaginationParams } from "../../../utils/pagination";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseUserStatus } from "@/utils/parseUserStatus";
import { PaginatedUserResponse, UserResponse } from "@/types/users/user-types";

const prisma = new PrismaClient();
export async function GET(req: Request) {
  try {
    const { page, limit, search, status } = getPaginationParams({
      url: req.url,
    });

    const [rawUsers, total] = await Promise.all([
      prisma.user.findMany({
        take: limit,
        include: {
          userRoles: { include: { role: true } },
          userMeters: true,
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count(),
    ]);

    const users = rawUsers.map(({ userRoles, ...user }) => ({
      ...user,
      role: userRoles[0]?.role.role_name ?? "Unknown",
    }));

    let filteredUsers = users;

    if (search) {
      filteredUsers = filteredUsers.filter((user) =>
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== "total") {
      const userStatus = parseUserStatus(status);
      filteredUsers = filteredUsers.filter(
        (user) => user.status === userStatus
      );
    }

    const paginatedData = filteredUsers.slice((page - 1) * limit, page * limit);
    const totalFiltered = filteredUsers.length;

    const counts = {
      actives: users.filter((user) => user.status === "ACTIVE").length,
      inactives: users.filter((user) => user.status === "INACTIVE").length,
      pendings: users.filter((user) => user.status === "PENDING").length,
      blockeds: users.filter((user) => user.status === "BLOCKED").length,
    };

    return NextResponse.json<PaginatedUserResponse>({
      data: paginatedData,
      pagination: {
        total: total,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit),
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
      address: { data, lat, lng },
    } = body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const createdAddress = await tx.address.create({
        data: {
          data,
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
