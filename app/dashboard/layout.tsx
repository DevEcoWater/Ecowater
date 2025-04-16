import "../globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

import {
  SidebarInset,
  SidebarProvider as UiSidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UiSidebarProvider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AppSidebar />
        <SidebarInset>
          <div
            id="content"
            className={cn(
              "ml-auto w-full max-w-full",
              "peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]",
              "peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]",
              "transition-[width] duration-200 ease-linear",
              "flex h-svh flex-col",
              "group-data-[scroll-locked=1]/body:h-full",
              "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
            )}
          >
            {/* ===== Content ===== */}
            {children}
          </div>
        </SidebarInset>
      </ThemeProvider>
    </UiSidebarProvider>
  );
}
