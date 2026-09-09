/**
 * client.config.ts — Per-client static configuration
 *
 * This module is the single source of truth for everything that changes per client.
 * All values here are committed to the repo — the repo IS the client.
 *
 * Rule of thumb:
 *   - Same for every deploy of THIS client → goes here (committed TS).
 *   - Secret or a key that rotates independently → stays in env (.env.production).
 *
 * What stays in env (do NOT move here):
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_FIREBASE_* (build-time ARGs),
 *   AUTH_SECRET, DATABASE_URL, DIRECT_URL, MQTT_*, MONGO_*, CRM_*, CRON_SECRET,
 *   ADMIN_EMAIL, ADMIN_PASSWORD.
 *
 * Cooperative legal name (shown to authenticated users) comes from the DB
 * `Cooperative.name` row — NOT from here. This module only governs the static
 * "product brand" surfaces: login screen, <title>, version switcher, tours.
 *
 * Fields replaced by this config (original hardcoded locations):
 *   brand.name         → app/layout.tsx:22, app/portal/layout.tsx (metadata title),
 *                        components/layout/auth/layout.tsx:20+37,
 *                        components/version-switcher.tsx:42, config/tours.ts:9
 *   brand.logo         → components/layout/auth/layout.tsx:18+35,
 *                        components/version-switcher.tsx:38
 *   brand.logoMark     → components/app-sidebar.tsx (replaces cosego.svg import)
 *   brand.favicon      → app/layout.tsx:24-28
 *   theme.accentHex    → components/layout/auth/layout.tsx:31-32,
 *                        tailwind.config.ts (tertiary color)
 *   locale.lang        → app/layout.tsx:33
 *   locale.timezone    → utils/configureDayjs.ts:11,
 *                        utils/parseTimestamp .ts:29+35 (note: trailing space in filename),
 *                        utils/timestampConverter.ts:15,
 *                        components/meters/valve-control-panel.tsx:292
 *   locale.currency    → utils/formatPrice.ts
 *   locale.currencyLocale → utils/formatPrice.ts
 *   geo.mapCenter      → components/ui/map.tsx:57-58
 *   geo.mapBounds      → components/ui/map.tsx:405-412 (strictBounds restriction box)
 *   geo.defaultLocation → components/usuarios/register-form.tsx:34,
 *                         components/usuarios/update-register-form.tsx:51,
 *                         components/usuarios/user-detail.tsx:30,
 *                         components/medidores/mechanical-meter-form.tsx:32
 *   featureFlags.*     → app/api/cooperative/packs/route.ts (env fallback defaults)
 */

export interface ClientConfig {
  brand: {
    /** Static product name — login screen, <title>, version-switcher. NOT the cooperative legal name. */
    name: string;
    /** Path to the main logo (used in auth layout, version switcher). Relative to /public. */
    logo: string;
    /** Path to the compact logo mark (used in sidebar). Relative to /public. */
    logoMark: string;
    /** Path to the favicon. Relative to /public. */
    favicon: string;
  };
  theme: {
    /** Brand accent color as a hex string (e.g. "#2463EB"). Used in auth gradients and tailwind tertiary. */
    accentHex: string;
  };
  locale: {
    /** HTML lang attribute and dayjs locale (e.g. "es"). */
    lang: string;
    /** IANA timezone identifier (e.g. "America/Argentina/Buenos_Aires"). */
    timezone: string;
    /** ISO 4217 currency code (e.g. "ARS"). */
    currency: string;
    /** BCP 47 locale for Intl.NumberFormat (e.g. "es-AR"). */
    currencyLocale: string;
  };
  geo: {
    /** Default map center — where the map loads initially. */
    mapCenter: { lat: number; lng: number };
    /**
     * Half-side of the square bounding box (in degrees) used as the map's
     * strictBounds restriction. Box = center ± radiusDeg on both axes.
     */
    mapBounds: { radiusDeg: number };
    /** Default coordinates pre-filled in address/location forms. */
    defaultLocation: { lat: number; lng: number };
  };
  featureFlags: {
    /**
     * Default values when no CRM is configured and the FEATURE_* env vars are unset.
     * CRM response and FEATURE_* env vars always override these at runtime.
     */
    valveControl: boolean;
    advancedExport: boolean;
    urgencies: boolean;
  };
}

// ---------------------------------------------------------------------------
// Ecowater — production values (change these when forking for a new client)
// ---------------------------------------------------------------------------

export const clientConfig: ClientConfig = {
  brand: {
    name: "EcoWater",
    logo: "/eco-water.svg",
    logoMark: "/eco-water.svg",
    favicon: "/icon.svg",
  },
  theme: {
    accentHex: "#2463EB",
  },
  locale: {
    lang: "es",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    currencyLocale: "es-AR",
  },
  geo: {
    mapCenter: { lat: -34.908, lng: -58.036 },
    mapBounds: { radiusDeg: 0.05 },
    defaultLocation: { lat: -34.9035949, lng: -58.0373327 },
  },
  featureFlags: {
    valveControl: false,
    advancedExport: false,
    urgencies: false,
  },
};
