import { NextResponse } from "next/server";

/**
 * GET /api/cooperative/packs
 * Server-side proxy to the CRM API — keeps CRM_API_KEY off the client.
 * Falls back to {} (no packs) if env vars are missing or CRM is unreachable.
 */
export async function GET() {
  const crmUrl = process.env.CRM_URL;
  const apiKey = process.env.CRM_API_KEY;

  if (!crmUrl || !apiKey) {
    // No CRM configured — check local overrides for dev/testing
    return NextResponse.json({
      valve_control: process.env.FEATURE_VALVE_CONTROL === "true",
      advanced_export: process.env.FEATURE_ADVANCED_EXPORT === "true",
      urgencies: process.env.FEATURE_URGENCIES === "true",
    });
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
