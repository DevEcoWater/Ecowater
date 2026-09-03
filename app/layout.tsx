import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/providers/common/providers";
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

export async function generateMetadata(): Promise<Metadata> {
  try {
    const cooperative = await prisma.cooperative.findFirst({
      select: { name: true },
    });
    const title = cooperative?.name ?? "Eco Water";
    return {
      title,
      description: "",
      icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/icon.svg",
      },
    };
  } catch {
    return {
      title: "Eco Water",
      description: "",
      icons: {
        icon: "/icon.svg",
        shortcut: "/icon.svg",
        apple: "/icon.svg",
      },
    };
  }
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="es">
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
