import type { ClientConfig } from "../client.config";

/**
 * Olmos — demo deployment (smart + mechanical meters together).
 *
 * TODO(olmos): placeholders until the cooperative's data arrives — own logo
 * (public/brand/olmos/*), accent color and the real map center/bounds. Geo is
 * currently the same La Plata area as COSEGO so the demo map is not empty.
 */
export const olmosConfig: ClientConfig = {
  brand: {
    name: "EcoWater Olmos",
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
