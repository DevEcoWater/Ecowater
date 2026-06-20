import * as React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Providers from "@/components/providers/common/providers";
import { clientConfig } from "@/config/client.config";

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

export const metadata: Metadata = {
  title: clientConfig.brand.name,
  description: "",
  icons: {
    icon: clientConfig.brand.favicon,
    shortcut: clientConfig.brand.favicon,
    apple: clientConfig.brand.favicon,
  },
};

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang={clientConfig.locale.lang}>
      <body className={poppins.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
