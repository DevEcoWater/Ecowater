import { PrismaClient } from "@prisma/client";
// Relative import (not @/ alias) so tsx can resolve it without Next.js config
import { clientConfig } from "../config/client.config";

const prisma = new PrismaClient();

async function main() {
  // ──────────────────────────────────────────────
  // Roles — idempotent upsert
  // ──────────────────────────────────────────────
  const roles = ["admin", "supervisor", "user", "operario", "lector"] as const;
  for (const role_name of roles) {
    await prisma.role.upsert({
      where: { role_name },
      update: {},
      create: { role_name },
    });
  }

  // ──────────────────────────────────────────────
  // Cooperative — idempotent upsert via name
  // Values come from env vars first, then fall back to clientConfig defaults.
  // Set COOP_NAME, COOP_LOCATION, COOP_CONTACT, COOP_PHONE in .env.production
  // (or .env.local for dev) to customize per client on seed.
  // ──────────────────────────────────────────────
  const coopName     = process.env.COOP_NAME     ?? clientConfig.brand.name;
  const coopLocation = process.env.COOP_LOCATION ?? "Ciudad Principal";
  const coopContact  = process.env.COOP_CONTACT  ?? "Administrador";
  const coopPhone    = process.env.COOP_PHONE    ?? "+1234567890";

  const existing = await prisma.cooperative.findFirst();
  if (existing) {
    await prisma.cooperative.update({
      where: { id: existing.id },
      data: {
        name:           coopName,
        location:       coopLocation,
        contact_person: coopContact,
        phone_number:   coopPhone,
        status:         "ACTIVE",
      },
    });
    console.log(`[seed] Cooperative updated: ${coopName}`);
  } else {
    await prisma.cooperative.create({
      data: {
        name:           coopName,
        location:       coopLocation,
        contact_person: coopContact,
        phone_number:   coopPhone,
        status:         "ACTIVE",
      },
    });
    console.log(`[seed] Cooperative created: ${coopName}`);
  }

  console.log("[seed] Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
