/**
 * demo-sql.ts
 *
 * Genera el SQL de una cooperativa de DEMOSTRACION: medidores inteligentes y
 * mecanicos, socios, operarios, zonas y dos meses de lecturas, todo inventado.
 * Es para mostrar la plataforma a un cliente nuevo, no para una instancia real.
 *
 * No se conecta a ninguna base: escribe SQL por stdout y se aplica aparte.
 *
 *   DEMO_USER_PASSWORD=... NEXT_PUBLIC_CLIENT=olmos npx tsx prisma/demo-sql.ts > demo.sql
 *   ssh vps 'docker exec -i olmos-postgres psql -U olmos -d ecowater_olmos -v ON_ERROR_STOP=1' < demo.sql
 *
 * Protecciones: el SQL se niega a correr si la cooperativa no termina en
 * "(demo)" o si la base ya tiene medidores, para que no se pueda aplicar por
 * error sobre una instancia con datos reales. Debe correr despues del seed
 * (roles y cooperativa) y de create-admin.
 */

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { clientConfig } from "../config/client.config";

const password = process.env.DEMO_USER_PASSWORD;
if (!password) {
  console.error("Falta DEMO_USER_PASSWORD (clave de los usuarios de demo).");
  process.exit(1);
}
const passwordHash = bcrypt.hashSync(password, 10);

// PRNG con semilla: el mismo comando genera siempre los mismos datos.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261016);
const between = (a: number, b: number) => a + rnd() * (b - a);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rnd() * xs.length)];

const q = (s: string | null) =>
  s === null ? "NULL" : `'${s.replace(/'/g, "''")}'`;
const ts = (d: Date) => q(d.toISOString().replace("T", " ").replace("Z", ""));
const num = (n: number, dec = 3) => n.toFixed(dec);

const center = clientConfig.geo.mapCenter;
const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

// ── Datos base ───────────────────────────────────────────────────────────────
const FIRST = ["Lucía", "Martín", "Sofía", "Mateo", "Valentina", "Joaquín", "Camila", "Tomás", "Julieta", "Nicolás", "Agustina", "Facundo", "Micaela", "Lautaro", "Florencia", "Bruno", "Carolina", "Gonzalo", "Rocío", "Franco"] as const;
const LAST = ["Gómez", "Rodríguez", "Fernández", "López", "Martínez", "Pérez", "Sánchez", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Molina"] as const;
const STREETS = ["Calle 12", "Calle 14", "Calle 20", "Calle 24", "Calle 30", "Av. 7", "Av. 13", "Calle 41", "Calle 55", "Calle 60"] as const;

const BAND_LNG = 0.012;
const bands = [
  { name: "Zona Norte", color: "#3B82F6", latMin: center.lat + 0.004, latMax: center.lat + 0.012 },
  { name: "Zona Centro", color: "#10B981", latMin: center.lat - 0.004, latMax: center.lat + 0.004 },
  { name: "Zona Sur", color: "#F59E0B", latMin: center.lat - 0.012, latMax: center.lat - 0.004 },
];

const out: string[] = [];
const emit = (s: string) => out.push(s);
function insertRows(table: string, cols: string[], rows: string[][]) {
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const part = rows.slice(i, i + CHUNK).map((r) => `(${r.join(", ")})`);
    emit(`INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES\n${part.join(",\n")};`);
  }
}

emit("BEGIN;");
emit(`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "Cooperative" WHERE name LIKE '%(demo)') THEN
    RAISE EXCEPTION 'Esta base no es de demo: la cooperativa no termina en (demo). Aborto.';
  END IF;
  IF EXISTS (SELECT 1 FROM "Meter") THEN
    RAISE EXCEPTION 'La base ya tiene medidores. Aborto para no mezclar datos.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "Role" WHERE role_name = 'user') THEN
    RAISE EXCEPTION 'Faltan los roles: correr primero el seed.';
  END IF;
END $$;`);
// La base de una instancia nueva puede haberse creado antes de que existiera
// has_valve (PR de valvulas): agregarla si falta es inocuo en el resto de casos.
emit(`ALTER TABLE "Meter" ADD COLUMN IF NOT EXISTS "has_valve" BOOLEAN NOT NULL DEFAULT false;`);
emit(`UPDATE "Cooperative" SET lat = ${center.lat}, lng = ${center.lng};`);

// ── Zonas ────────────────────────────────────────────────────────────────────
const zones = bands.map((b) => ({ id: randomUUID(), ...b }));
insertRows(
  "Zone",
  ["id", "name", "color", "polygon", "status", "operator_target", "updated_at"],
  zones.map((z) => [
    q(z.id),
    q(z.name),
    q(z.color),
    q(
      JSON.stringify([
        { lat: z.latMax, lng: center.lng - BAND_LNG },
        { lat: z.latMax, lng: center.lng + BAND_LNG },
        { lat: z.latMin, lng: center.lng + BAND_LNG },
        { lat: z.latMin, lng: center.lng - BAND_LNG },
      ])
    ) + "::jsonb",
    q("ACTIVE"),
    "14",
    ts(now),
  ])
);

// ── Medidores ────────────────────────────────────────────────────────────────
const N_SMART = 16;
const N_MECH = 24;
type DemoMeter = {
  id: string;
  smart: boolean;
  idx: number;
  lat: number;
  lng: number;
  dailyUse: number;
  start: number;
  mstatus: "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "FAULTY";
  ostatus: "OPERATIONAL" | "NEEDS_MAINTENANCE" | "ERROR";
  lowBattery: boolean;
  street: string;
  silentDays: number; // dias sin reportar (medidor inactivo)
};
const meters: DemoMeter[] = [];
for (let i = 0; i < N_SMART + N_MECH; i++) {
  const band = bands[i % 3];
  const smart = i < N_SMART;
  const m: DemoMeter = {
    id: randomUUID(),
    smart,
    idx: smart ? i + 1 : i - N_SMART + 1,
    lat: between(band.latMin + 0.0005, band.latMax - 0.0005),
    lng: between(center.lng - BAND_LNG + 0.001, center.lng + BAND_LNG - 0.001),
    dailyUse: between(0.35, 1.1),
    start: between(80, 450),
    mstatus: "ACTIVE",
    ostatus: "OPERATIONAL",
    lowBattery: false,
    street: `${pick(STREETS)} N° ${100 + Math.floor(rnd() * 900)}`,
    silentDays: 0,
  };
  meters.push(m);
}
// Algo de variedad para que haya alertas que mostrar.
meters[13].mstatus = "INACTIVE";
meters[13].silentDays = 3;
meters[14].mstatus = "MAINTENANCE";
meters[14].ostatus = "NEEDS_MAINTENANCE";
meters[14].lowBattery = true; // bateria baja => MAINTENANCE, igual que parseMeterStatus
meters[N_SMART + 5].mstatus = "FAULTY";
meters[N_SMART + 5].ostatus = "ERROR";
meters[N_SMART + 9].mstatus = "INACTIVE";

const label = (m: DemoMeter) =>
  m.smart ? `Medidor ${String(m.idx).padStart(3, "0")}` : `Mecánico ${String(m.idx).padStart(3, "0")}`;
const devEui = (m: DemoMeter) => `a840411c${m.idx.toString(16).padStart(8, "0")}`;

insertRows(
  "Meter",
  ["id", "dev_eui", "device_name", "meter_type", "street_address", "application_id", "application_name", "lat", "lng", "status", "operational_status", "has_valve", "created_at", "updated_at"],
  meters.map((m, i) => [
    q(m.id),
    m.smart ? q(devEui(m)) : "NULL",
    q(label(m)),
    q(m.smart ? "SMART" : "MECHANICAL"),
    q(m.street),
    m.smart ? q("1") : "NULL",
    m.smart ? q("Demo") : "NULL",
    String(m.lat),
    String(m.lng),
    q(m.mstatus),
    q(m.ostatus),
    // Los primeros 10 inteligentes tienen valvula; el resto no (para mostrar la diferencia).
    m.smart && i < 10 ? "true" : "false",
    ts(daysAgo(120)),
    ts(now),
  ])
);

// ── Usuarios ─────────────────────────────────────────────────────────────────
type DemoUser = { id: string; addressId: string; email: string; first: string; last: string; role: string; lat: number; lng: number; street?: string };
const users: DemoUser[] = [];
const taken = new Set<string>();
function newUser(role: string, emailLocal?: string, first?: string, last?: string): DemoUser {
  let f = first ?? pick(FIRST);
  let l = last ?? pick(LAST);
  let local = emailLocal ?? `${f}.${l}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let n = 1;
  while (taken.has(local)) local = `${local.replace(/\d+$/, "")}${++n}`;
  taken.add(local);
  const band = pick(bands);
  const u: DemoUser = {
    id: randomUUID(),
    addressId: randomUUID(),
    email: `${local}@demo.olmos.test`,
    first: f,
    last: l,
    role,
    lat: between(band.latMin, band.latMax),
    lng: between(center.lng - BAND_LNG, center.lng + BAND_LNG),
  };
  users.push(u);
  return u;
}
const operarios = [
  newUser("operario", "operario1", "Hernán", "Castro"),
  newUser("operario", "operario2", "Paula", "Vega"),
  newUser("operario", "operario3", "Diego", "Ibáñez"),
];
newUser("lector", "lector", "Laura", "Ortiz");
const socios: DemoUser[] = [];
for (let i = 0; i < 36; i++) socios.push(newUser("user"));

// Cada socio vive donde esta su medidor: asi la lista de medidores (que muestra
// la direccion corta del socio para los inteligentes) y el mapa coinciden.
socios.forEach((s, i) => {
  s.lat = meters[i].lat;
  s.lng = meters[i].lng;
  s.street = meters[i].street;
});
insertRows(
  "Address",
  ["id", "lat", "lng", "data", "shortData"],
  users.map((u) => {
    const street = u.street ?? `${pick(STREETS)} N° ${100 + Math.floor(rnd() * 900)}`;
    return [
      q(u.addressId),
      q(String(u.lat)),
      q(String(u.lng)),
      q(`${street}, Lisandro Olmos, La Plata`),
      q(`${street}, Lisandro Olmos`),
    ];
  })
);
insertRows(
  "User",
  ["id", "email", "password", "addressId", "firstName", "lastName", "status", "can_write", "updated_at"],
  users.map((u) => [
    q(u.id),
    q(u.email),
    q(passwordHash),
    q(u.addressId),
    q(u.first),
    q(u.last),
    q("ACTIVE"),
    "false",
    ts(now),
  ])
);
for (const role of ["operario", "lector", "user"]) {
  const ids = users.filter((u) => u.role === role).map((u) => u.id);
  emit(
    `INSERT INTO "UserRole" ("user_id", "role_id") SELECT u, (SELECT id FROM "Role" WHERE role_name = '${role}') FROM unnest(ARRAY[${ids.map(q).join(", ")}]) AS u;`
  );
}
insertRows(
  "UserMeter",
  ["id", "user_id", "meter_id"],
  socios.map((s, i) => [q(randomUUID()), q(s.id), q(meters[i].id)])
);
insertRows(
  "ZoneOperator",
  ["id", "zone_id", "user_id"],
  operarios.map((o, i) => [q(randomUUID()), q(zones[i].id), q(o.id)])
);

// ── Lecturas ─────────────────────────────────────────────────────────────────
const gatewayId = randomUUID();
emit(
  `INSERT INTO "Gateway" ("id", "gateway_code", "updated_at") VALUES (${q(gatewayId)}, 'DEMO-GW-001', ${ts(now)});`
);

const readings: string[][] = [];
const statuses: string[][] = [];
const rxinfos: string[][] = [];

for (const m of meters) {
  let cumulative = m.start;
  if (m.smart) {
    // Un reporte cada 12 h durante 60 dias.
    const steps = 120;
    let fCnt = 1000;
    for (let s = steps; s >= 0; s--) {
      const when = new Date(now.getTime() - s * 12 * 3_600_000 - m.silentDays * 86_400_000);
      if (when > now) continue;
      const weekday = when.getUTCDay();
      const use = (m.dailyUse / 2) * (weekday === 0 || weekday === 6 ? 1.25 : 1) * between(0.7, 1.3);
      cumulative += use;
      const id = randomUUID();
      readings.push([
        q(id), q(m.id), ts(when), String(fCnt++), "2",
        q(num(cumulative)), q(num(m.dailyUse)), q("0.000"), q(num(use / 12, 4)),
        q(num(between(16, 21), 1)), q("0"), String(num(use, 3)), q("VALID"),
      ]);
      statuses.push([
        q(randomUUID()), q(id), q("open"), q(m.lowBattery ? "low" : "normal"), "false", "false",
        "false", "false", "false", "false", q(m.mstatus), q(m.ostatus),
      ]);
      rxinfos.push([
        q(randomUUID()), q(id), q(gatewayId), num(between(2, 10), 1), String(-Math.round(between(70, 108))),
        String(center.lat), String(center.lng), ts(when),
      ]);
    }
  } else if (m.mstatus !== "INACTIVE") {
    // Lectura manual mensual, cargada por un operario, durante 6 meses.
    for (let mo = 6; mo >= 0; mo--) {
      const when = daysAgo(mo * 30 + Math.floor(between(0, 4)));
      const use = m.dailyUse * 30 * between(0.8, 1.2);
      cumulative += use;
      readings.push([
        q(randomUUID()), q(m.id), ts(when), "NULL", "NULL",
        q(num(cumulative, 1)), "NULL", "NULL", "NULL", "NULL", "NULL", String(num(use, 1)), q("VALID"),
      ]);
    }
  }
}

// Las lecturas manuales llevan al operario que las cargo.
const readingCols = ["id", "meter_id", "timestamp", "fCnt", "fPort", "cumulative_flow", "cumulative_daily_flow", "reverse_flow", "instantaneous_flow", "real_time_temperature", "alarm_status", "consumption", "status"];
insertRows("Reading", readingCols, readings);
insertRows(
  "Status",
  ["id", "reading_id", "valve_status", "battery_voltage", "battery_status", "empty_pipe_alarm", "reverse_flow_alarm", "over_range_alarm", "water_temp_alarm", "ee_alarm", "meter_status", "operational_status"],
  statuses
);
insertRows(
  "RxInfo",
  ["id", "reading_id", "gateway_id", "lora_snr", "rssi", "latitude", "longitude", "time"],
  rxinfos
);
emit(
  `UPDATE "Reading" SET "submitted_by" = ${q(operarios[0].id)} WHERE "fCnt" IS NULL;`
);

emit("COMMIT;");
process.stdout.write(out.join("\n") + "\n");
console.error(
  `[demo-sql] ${meters.length} medidores (${N_SMART} inteligentes, ${N_MECH} mecanicos), ${users.length} usuarios, ${zones.length} zonas, ${readings.length} lecturas.`
);
