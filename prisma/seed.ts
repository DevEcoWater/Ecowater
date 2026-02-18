import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Sembrar roles
  await prisma.role.upsert({
    where: { role_name: "admin" },
    update: {},
    create: {
      role_name: "admin",
    },
  });

  await prisma.role.upsert({
    where: { role_name: "supervisor" },
    update: {},
    create: {
      role_name: "supervisor",
    },
  });

  await prisma.role.upsert({
    where: { role_name: "user" },
    update: {},
    create: {
      role_name: "user",
    },
  });

  // Opción 1: Usar create directamente si sabes que la base de datos está vacía
  try {
    await prisma.cooperative.create({
      data: {
        name: "Cooperativa Principal",
        location: "Ciudad Principal",
        contact_person: "Administrador",
        phone_number: "+1234567890",
        status: "ACTIVE",
      },
    });
  } catch (error) {
    // Si ya existe, ignorar el error
    console.log("La cooperativa ya existe o hubo un error al crearla:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
