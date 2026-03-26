import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const where: any = {
      userRoles: {
        some: { role: { role_name: "operario" } },
      },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [operarios, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          userRoles: { include: { role: true } },
          zoneOperators: { include: { zone: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const data = operarios.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      status: u.status,
      role: u.userRoles[0]?.role.role_name ?? "operario",
      assignedZones: u.zoneOperators.map((zo) => ({
        id: zo.zone.id,
        name: zo.zone.name,
        color: zo.zone.color,
      })),
    }));

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET OPERARIOS]", error);
    return NextResponse.json(
      { error: "Failed to fetch operarios" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password } = body;

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    const operarioRole = await prisma.role.findUnique({
      where: { role_name: "operario" },
    });
    if (!operarioRole) {
      return NextResponse.json(
        { error: "Rol 'operario' no encontrado" },
        { status: 500 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const address = await tx.address.create({
        data: { lat: "0", lng: "0", data: "", shortData: null },
      });
      const newUser = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          status: "ACTIVE",
          addressId: address.id,
        },
      });
      await tx.userRole.create({
        data: { user_id: newUser.id, role_id: operarioRole.id },
      });
      return newUser;
    });

    return NextResponse.json(
      { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST OPERARIO]", error);
    return NextResponse.json(
      { error: "Failed to create operario" },
      { status: 500 }
    );
  }
}
