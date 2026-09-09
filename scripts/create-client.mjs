#!/usr/bin/env node
/**
 * create-client.mjs
 *
 * Scaffolder for new per-client repos.
 * Generates the per-client surface (config, deploy names, env skeleton) from a
 * template based on this repo.
 *
 * Usage:
 *   node scripts/create-client.mjs \
 *     --slug aquacoop-norte \
 *     --domain aquacoop-norte.example.com \
 *     --brand-name "Aqua Coop Norte" \
 *     [--output /path/to/new-repo]     # default: ../aquacoop-norte (sibling dir)
 *     [--lat -34.9]                    # map center lat (default: clientConfig.geo.mapCenter.lat)
 *     [--lng -58.0]                    # map center lng (default: clientConfig.geo.mapCenter.lng)
 *     [--dry-run]                      # print what would be done, no writes
 *
 * Sync model (D0):
 *   Each client repo adds this repo as a "core" remote to pull bug-fixes:
 *
 *     git remote add core https://github.com/DevEcoWater/Ecowater.git
 *     git fetch core
 *     git merge core/main
 *     # Resolve the known per-client files:
 *     #   config/client.config.ts, public/brand/*, deploy/nginx/<slug>.conf,
 *     #   deploy/env/.env.production
 *
 *   Per-client files are intentionally minimal so merges stay trivial.
 *
 * What this script does:
 *   1. Validates slug (lowercase letters, numbers, hyphens only)
 *   2. Copies THIS repo to the output dir (git clone --local or copies tracked files)
 *   3. Patches config/client.config.ts with the new brand/geo values
 *   4. Renames/patches deploy/nginx/ecowater.conf → <slug>.conf with real domain
 *   5. Generates deploy/env/.env.production skeleton (secrets left blank w/ TODO)
 *   6. Prints the git bootstrap commands for the new repo
 *
 * Note: this script requires Node 18+ (uses fs/promises, URL, etc.)
 */

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// ──────────────────────────────────────────────────────────────────────────────
// CLI parsing
// ──────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const has = (flag) => args.includes(flag);

const slug       = get("--slug");
const domain     = get("--domain");
const brandName  = get("--brand-name");
const latArg     = get("--lat");
const lngArg     = get("--lng");
const dryRun     = has("--dry-run");
const outputArg  = get("--output");

function printUsage() {
  console.log(`
Usage:
  node scripts/create-client.mjs \\
    --slug <slug> \\
    --domain <domain> \\
    --brand-name "<Brand Name>" \\
    [--output /path/to/new-repo] \\
    [--lat -34.9] [--lng -58.0] \\
    [--dry-run]

  --slug         Client identifier (lowercase letters, numbers, hyphens only)
  --domain       Domain name (e.g. aquacoop-norte.example.com)
  --brand-name   Display name for the product (e.g. "Aqua Coop Norte")
  --output       Output directory (default: sibling dir named <slug>)
  --lat / --lng  Map center coordinates (default: current config values)
  --dry-run      Print what would be done without writing any files
`);
}

if (!slug || !domain || !brandName) {
  printUsage();
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error(`ERROR: --slug must be lowercase letters, numbers, and hyphens only. Got: "${slug}"`);
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────────────────────────────────────

const __dirname  = dirname(fileURLToPath(import.meta.url));
const repoRoot   = resolve(__dirname, "..");
const outputDir  = outputArg ? resolve(outputArg) : resolve(repoRoot, `../${slug}`);

// ──────────────────────────────────────────────────────────────────────────────
// Dry-run helpers
// ──────────────────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}

function write(filePath, content) {
  if (dryRun) {
    log(`[DRY-RUN] Would write: ${filePath}`);
    return;
  }
  const dir = dirname(filePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(filePath, content, "utf8");
  log(`[write] ${filePath}`);
}

function patch(filePath, find, replace) {
  if (dryRun) {
    log(`[DRY-RUN] Would patch: ${filePath} (${find} → ${replace})`);
    return;
  }
  const content = readFileSync(filePath, "utf8");
  const next = content.split(find).join(replace);
  if (next === content) {
    log(`[warn] No match for "${find}" in ${filePath}`);
  } else {
    writeFileSync(filePath, next, "utf8");
    log(`[patch] ${filePath}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1: Clone the repo
// ──────────────────────────────────────────────────────────────────────────────

log(`\n=== Creating client repo: ${slug} ===`);
log(`Output: ${outputDir}`);
log(`Domain:  ${domain}`);
log(`Brand:   ${brandName}`);
if (dryRun) log("(DRY-RUN mode — no files will be written)\n");

if (!dryRun) {
  if (existsSync(outputDir)) {
    console.error(`ERROR: Output directory already exists: ${outputDir}`);
    process.exit(1);
  }
  log(`\n[step 1] Cloning repo to ${outputDir}...`);
  execSync(`git clone --local "${repoRoot}" "${outputDir}"`, { stdio: "inherit" });
  // Remove the origin remote (points to this repo); will be re-added as 'core' below
  execSync(`git -C "${outputDir}" remote remove origin`, { stdio: "inherit" });
  log("[step 1] Clone complete.");
} else {
  log(`[DRY-RUN step 1] Would clone repo to ${outputDir}`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 2: Patch config/client.config.ts
// ──────────────────────────────────────────────────────────────────────────────

log("\n[step 2] Patching config/client.config.ts...");
const configPath = join(outputDir, "config/client.config.ts");

// Read lat/lng from existing config or use provided args
let lat = latArg ? parseFloat(latArg) : null;
let lng = lngArg ? parseFloat(lngArg) : null;

if (!dryRun) {
  // Read existing config to use as defaults for lat/lng
  try {
    const existing = readFileSync(configPath, "utf8");
    if (lat === null) {
      const m = existing.match(/mapCenter:\s*\{\s*lat:\s*([-\d.]+)/);
      lat = m ? parseFloat(m[1]) : -34.908;
    }
    if (lng === null) {
      const m = existing.match(/mapCenter:\s*\{[^}]*lng:\s*([-\d.]+)/);
      lng = m ? parseFloat(m[1]) : -58.036;
    }
  } catch {
    lat = lat ?? -34.908;
    lng = lng ?? -58.036;
  }

  // Read current config, replace brand name and map center
  let config = readFileSync(configPath, "utf8");
  // Replace brand name
  config = config.replace(
    /name:\s*"[^"]*"/,
    `name: "${brandName}"`,
  );
  // Replace mapCenter lat
  config = config.replace(
    /mapCenter:\s*\{\s*lat:\s*[-\d.]+,\s*lng:\s*[-\d.]+\s*\}/,
    `mapCenter: { lat: ${lat}, lng: ${lng} }`,
  );
  // Replace defaultLocation lat/lng
  config = config.replace(
    /defaultLocation:\s*\{\s*lat:\s*[-\d.]+,\s*lng:\s*[-\d.]+\s*\}/,
    `defaultLocation: { lat: ${lat}, lng: ${lng} }`,
  );
  writeFileSync(configPath, config, "utf8");
  log(`[step 2] config/client.config.ts patched.`);
} else {
  log(`[DRY-RUN step 2] Would patch config/client.config.ts:`);
  log(`  brand.name → "${brandName}"`);
  log(`  geo.mapCenter → { lat: ${latArg ?? "<current>"}, lng: ${lngArg ?? "<current>"} }`);
  log(`  geo.defaultLocation → same as mapCenter`);
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3: Generate nginx config for this client
// ──────────────────────────────────────────────────────────────────────────────

log("\n[step 3] Generating deploy/nginx/<slug>.conf...");
const nginxTemplate = `server {
    listen 80;
    listen [::]:80;
    server_name ${domain} www.${domain};

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
`;
write(join(outputDir, `deploy/nginx/${slug}.conf`), nginxTemplate);

// ──────────────────────────────────────────────────────────────────────────────
// Step 4: Generate .env.production skeleton
// ──────────────────────────────────────────────────────────────────────────────

log("\n[step 4] Generating deploy/env/.env.production skeleton...");
const envSkeleton = `# ============================================================
# .env.production — ${brandName} (${slug})
# Generated by scripts/create-client.mjs — fill in all TODO values
# ============================================================

# ── Client identity ─────────────────────────────────────────
CLIENT_SLUG=${slug}
DOMAIN=${domain}
APP_BASE_URL=https://${domain}
COMPOSE_PROJECT_NAME=${slug}

# ── App ─────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000

# ── Auth secrets (generate with: openssl rand -hex 32) ──────
AUTH_SECRET=TODO
NEXTAUTH_SECRET=TODO

# ── Cron ────────────────────────────────────────────────────
CRON_SECRET=TODO

# ── Database ─────────────────────────────────────────────────
POSTGRES_DB=${slug.replace(/-/g, "_")}
POSTGRES_USER=${slug.replace(/-/g, "_")}_user
POSTGRES_PASSWORD=TODO
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@${slug}-postgres:5432/\${POSTGRES_DB}?schema=public
DIRECT_URL=\${DATABASE_URL}

# ── MQTT ─────────────────────────────────────────────────────
MQTT_BROKER_URL=mqtt://${slug}-mqtt:1883
MQTT_USERNAME=backend
MQTT_PASSWORD=TODO

# ── Bootstrap (set true only on FIRST startup, then false) ──
BOOTSTRAP_ON_START=true
COOP_NAME=${brandName}
COOP_LOCATION=TODO
COOP_CONTACT=TODO
COOP_PHONE=TODO
ADMIN_EMAIL=TODO
ADMIN_PASSWORD=TODO

# ── Google Maps (baked at build time) ────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TODO

# ── Firebase (baked at build time) ───────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=TODO
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=TODO
NEXT_PUBLIC_FIREBASE_PROJECT_ID=TODO
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=TODO
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=TODO
NEXT_PUBLIC_FIREBASE_APP_ID=TODO
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=TODO

# ── CRM (optional — omit to use local feature-flag defaults) ─
# CRM_URL=
# CRM_API_KEY=

# ── Feature flags (only needed if no CRM configured) ─────────
# FEATURE_VALVE_CONTROL=false
# FEATURE_ADVANCED_EXPORT=false
# FEATURE_URGENCIES=false

# ── Migrations ───────────────────────────────────────────────
SKIP_DB_MIGRATIONS=false

# ── MongoDB audit log (optional) ─────────────────────────────
# MONGO_AUDIT_URI=
# MONGO_AUDIT_DB=${slug.replace(/-/g, "_")}audit
`;
write(join(outputDir, "deploy/env/.env.production"), envSkeleton);

// ──────────────────────────────────────────────────────────────────────────────
// Step 5: Print git bootstrap instructions
// ──────────────────────────────────────────────────────────────────────────────

log(`
=== Done! Next steps for ${slug} ===

1. Create the remote repo (once):
   gh repo create DevEcoWater/${slug} --private --source "${outputDir}" --push

   OR manually:
   cd "${outputDir}"
   git remote add origin https://github.com/DevEcoWater/${slug}.git
   git push -u origin main

2. Add 'core' remote to pull upstream bug-fixes:
   cd "${outputDir}"
   git remote add core https://github.com/DevEcoWater/Ecowater.git

   To pull core fixes into a client repo later:
   git fetch core
   git merge core/main
   # Resolve per-client files if conflicted:
   #   config/client.config.ts  (keep your values)
   #   deploy/nginx/${slug}.conf  (keep your domain)
   #   deploy/env/.env.production  (keep your secrets)

3. Fill in all TODO values in:
   ${outputDir}/deploy/env/.env.production

4. Replace brand assets (optional — same file paths, swap contents):
   ${outputDir}/public/eco-water.svg   → client logo
   ${outputDir}/public/icon.svg        → client favicon
   ${outputDir}/public/fallbackimage.png

5. VPS deploy (from deploy/docs/DEPLOY_VPS.md):
   - git clone the new repo onto the VPS
   - copy deploy/env/.env.production with real values
   - Set BOOTSTRAP_ON_START=true for first boot (creates coop + admin user)
   - docker compose -f deploy/compose/docker-compose.prod.yml \\
       --env-file deploy/env/.env.production up -d --build
   - Set up nginx: cp deploy/nginx/${slug}.conf /etc/nginx/sites-available/${slug}
   - ln -s /etc/nginx/sites-available/${slug} /etc/nginx/sites-enabled/${slug}
   - nginx -t && nginx -s reload
   - certbot --nginx -d ${domain} -d www.${domain}
   - Install crontab: 0 6 * * * cd /path/to/repo && bash deploy/scripts/run-meter-cron.sh
   - After first boot: set BOOTSTRAP_ON_START=false in .env.production
`);
