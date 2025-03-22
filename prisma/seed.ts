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

  // Sembrar tipos de estado
  await prisma.statusType.upsert({
    where: { name: "valve_status" },
    update: {},
    create: {
      name: "valve_status",
      description: "Estado de la válvula del medidor",
      values: {
        create: [
          { value: "open", description: "Válvula abierta" },
          { value: "closed", description: "Válvula cerrada" },
          {
            value: "partially_open",
            description: "Válvula parcialmente abierta",
          },
        ],
      },
    },
  });

  await prisma.statusType.upsert({
    where: { name: "battery_status" },
    update: {},
    create: {
      name: "battery_status",
      description: "Estado de la batería del medidor",
      values: {
        create: [
          { value: "good", description: "Batería en buen estado" },
          { value: "low", description: "Batería baja" },
          { value: "critical", description: "Batería en estado crítico" },
        ],
      },
    },
  });

  await prisma.statusType.upsert({
    where: { name: "alarm_status" },
    update: {},
    create: {
      name: "alarm_status",
      description: "Estado de alarmas del medidor",
      values: {
        create: [
          { value: "none", description: "Sin alarmas" },
          { value: "leak_detected", description: "Fuga detectada" },
          { value: "reverse_flow", description: "Flujo inverso detectado" },
          { value: "tamper_detected", description: "Manipulación detectada" },
        ],
      },
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
