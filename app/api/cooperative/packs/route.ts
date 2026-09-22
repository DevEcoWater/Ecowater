import { NextResponse } from "next/server";
import { clientConfig } from "@/config/client.config";

// Sin esto Next prerenderiza la ruta durante el build. El GET no recibe
// parametros ni usa nada dinamico, asi que califica como estatica: se ejecuta
// una sola vez al compilar y su respuesta queda congelada en la imagen.
//
// El build corre dentro del contenedor, donde las FEATURE_* no existen — el
// compose solo pasa las NEXT_PUBLIC_* como build args. Resultado: todos los
// flags quedaban en el default `false` de client.config y la variable de
// entorno del runtime no se leia nunca, porque la ruta no volvia a correr.
// Sintoma: FEATURE_VALVE_CONTROL=true en el contenedor y el endpoint
// devolviendo valve_control:false, con la tarjeta de valvula invisible.
export const dynamic = "force-dynamic";

/**
 * GET /api/cooperative/packs
 * Server-side proxy to the CRM API — keeps CRM_API_KEY off the client.
 * Falls back to clientConfig.featureFlags defaults when no CRM is configured.
 * FEATURE_* env vars override config defaults for dev/testing.
 */
export async function GET() {
  const crmUrl = process.env.CRM_URL;
  const apiKey = process.env.CRM_API_KEY;

  // Feature-flag defaults: env vars win if set, otherwise fall back to per-client config
  const localOverrides = {
    valve_control:
      process.env.FEATURE_VALVE_CONTROL !== undefined
        ? process.env.FEATURE_VALVE_CONTROL === "true"
        : clientConfig.featureFlags.valveControl,
    advanced_export:
      process.env.FEATURE_ADVANCED_EXPORT !== undefined
        ? process.env.FEATURE_ADVANCED_EXPORT === "true"
        : clientConfig.featureFlags.advancedExport,
    urgencies:
      process.env.FEATURE_URGENCIES !== undefined
        ? process.env.FEATURE_URGENCIES === "true"
        : clientConfig.featureFlags.urgencies,
  };

  if (!crmUrl || !apiKey) {
    return NextResponse.json(localOverrides);
  }

  try {
    const res = await fetch(`${crmUrl}/api/v1/packs`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 300 }, // Cache 5 minutes via Next.js fetch cache
    });

    if (!res.ok) {
      return NextResponse.json({
        valve_control: false,
        advanced_export: false,
        urgencies: false,
      });
    }

    const packs = await res.json();
    return NextResponse.json(packs);
  } catch {
    // CRM unreachable — silent fallback
    return NextResponse.json({
      valve_control: false,
      advanced_export: false,
      urgencies: false,
    });
  }
}
