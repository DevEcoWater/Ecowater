import type { ClientConfig } from "../client.config";

/**
 * Cooperativa de Agua Potable de Lisandro Olmos (La Plata) — demo deployment,
 * smart + mechanical meters together.
 *
 * Name, address and logo come from https://coopaguaolmos.com.ar/ (public site).
 * Map center is the geocoded locality (OpenStreetMap), not the cooperative's
 * office: Av. 44 y 195 bis.
 *
 * TODO(olmos): accentHex is eyeballed from the logo, confirm with the
 * cooperative's real brand color; mapBounds is a guess for the service area.
 */
export const olmosConfig: ClientConfig = {
  brand: {
    name: "Cooperativa de Agua Olmos",
    logo: "/brand/olmos/logo.png",
    logoMark: "/brand/olmos/logo.png",
    favicon: "/brand/olmos/logo.png",
  },
  theme: {
    accentHex: "#00A3E0",
  },
  locale: {
    lang: "es",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    currencyLocale: "es-AR",
  },
  geo: {
    mapCenter: { lat: -34.9953, lng: -58.0461 },
    mapBounds: { radiusDeg: 0.05 },
    defaultLocation: { lat: -34.9953, lng: -58.0461 },
  },
  featureFlags: {
    valveControl: false,
    advancedExport: false,
    urgencies: false,
  },
};
