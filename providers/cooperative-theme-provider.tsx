"use client";

import { useEffect } from "react";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";
import { hexToHslString, readableForeground } from "@/lib/color";

/**
 * Reads the cooperative's primary_color from the database and injects it into
 * the document's CSS custom properties, so every button, badge, and accent
 * in the dashboard reflects the cooperative's brand color automatically.
 *
 * Mount once inside the dashboard layout — it renders nothing.
 */
export function CooperativeThemeProvider() {
  const { data: cooperative } = useCooperative();
  // primary_color will be available after the Prisma migration runs
  const primaryColor = (cooperative as any)?.primary_color as string | undefined;

  useEffect(() => {
    if (!primaryColor) return;

    try {
      const hsl = hexToHslString(primaryColor);
      const fg = readableForeground(primaryColor);

      const root = document.documentElement;
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--primary-foreground", fg);
      root.style.setProperty("--sidebar-primary", hsl);
      root.style.setProperty("--ring", hsl);
    } catch {
      // Invalid hex — skip silently
    }
  }, [primaryColor]);

  return null;
}
