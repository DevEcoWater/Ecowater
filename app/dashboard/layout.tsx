import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

import {
  SidebarInset,
  SidebarProvider as UiSidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import { Separator } from "@radix-ui/react-dropdown-menu";
import { SessionClient } from "./session";
import { BreadcrumbWithContext } from "@/components/breadcrumb";
import SidebarProvider from "@/context/sidebarProvider";
import { Toaster } from "@/components/ui/toaster";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import Profile from "@/components/profile";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Eco Water",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="./favicon.ico" />
      </head>
      <body className={poppins.className}>
        <SessionClient>
          <SidebarProvider>
            <UiSidebarProvider>
              <ThemeProvider attribute="class" defaultTheme="light">
                <AppSidebar />
                <SidebarInset>
                  <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
                    <div className="flex items-center">
                      <SidebarTrigger className="-ml-1" />
                      <Separator className="mr-2 h-4" />{" "}
                      <BreadcrumbWithContext />
                    </div>
                    <Profile />
                  </header>
                  <main className="flex flex-1 flex-col gap-4 p-4">
                    <section className="min-h-screen flex-1">
                      {children}
                    </section>
                  </main>
                </SidebarInset>
              </ThemeProvider>
            </UiSidebarProvider>
          </SidebarProvider>
        </SessionClient>
        <Toaster />
      </body>
    </html>
  );
}
