/**
 * create-admin.ts
 *
 * Bootstrap the first admin user for a fresh instance. Idempotent — safe to
 * re-run; does nothing if the user already exists.
 *
 * Required env vars:
 *   ADMIN_EMAIL     — the admin user's email
 *   ADMIN_PASSWORD  — plaintext password (hashed here with bcryptjs rounds=10)
 *
 * Optional env vars:
 *   ADMIN_FIRST_NAME  (default: "Admin")
 *   ADMIN_LAST_NAME   (default: "Principal")
 *
 * Usage:
 *   npx tsx prisma/create-admin.ts
 *   # or via package.json script:
 *   npm run create-admin
 *
 * NOTE: uses bcryptjs with salt rounds = 10 to match app/api/user/route.ts.
 * Do NOT change the rounds value without updating the auth route too.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 10; // must match app/api/user/route.ts bcrypt.hash(password, 10)

async function main() {
  const email     = process.env.ADMIN_EMAIL;
  const password  = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME ?? "Admin";
  const lastName  = process.env.ADMIN_LAST_NAME  ?? "Principal";

  if (!email || !password) {
    console.error("[create-admin] ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
    process.exit(1);
  }

  // Idempotency check — skip if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[create-admin] User ${email} already exists — skipping.`);
    return;
  }

  // Look up the admin role
  const adminRole = await prisma.role.findUnique({ where: { role_name: "admin" } });
  if (!adminRole) {
    console.error("[create-admin] ERROR: 'admin' role not found. Run prisma db seed first.");
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    // Address is required (non-nullable) on User; create a placeholder for the admin
    const address = await tx.address.create({
      data: {
        data:      "Dirección de administrador",
        shortData: "Admin",
        lat:       0,
        lng:       0,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        addressId: address.id,
        status:    "ACTIVE",
        can_write: true,
      },
    });

    await tx.userRole.create({
      data: {
        user_id: user.id,
        role_id: adminRole.id,
      },
    });

    console.log(`[create-admin] Admin user created: ${email}`);
  });
}

main()
  .catch((e) => {
    console.error("[create-admin] Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
