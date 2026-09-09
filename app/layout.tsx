import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/providers/common/providers";
import { clientConfig } from "@/config/client.config";
import { prisma } from "@/lib/prisma";

export const viewport = {
  width: "device-width",
  initialScale: 1,
} satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

// Title prefers the cooperative's legal name from the DB (main), and falls back
// to the static product brand from client.config (multicliente). Icons are
// always the per-client brand asset.
export async function generateMetadata(): Promise<Metadata> {
  const icons = {
    icon: clientConfig.brand.favicon,
    shortcut: clientConfig.brand.favicon,
    apple: clientConfig.brand.favicon,
  };

  try {
    const cooperative = await prisma.cooperative.findFirst({
      select: { name: true },
    });
    return {
      title: cooperative?.name ?? clientConfig.brand.name,
      description: "",
      icons,
    };
  } catch {
    return {
      title: clientConfig.brand.name,
      description: "",
      icons,
    };
  }
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang={clientConfig.locale.lang}>
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
