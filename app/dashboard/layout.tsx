import "../globals.css";
import { ThemeProvider } from "@/providers/theme-provider";

import {
  SidebarInset,
  SidebarProvider as UiSidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import SidebarProvider from "@/context/sidebarProvider";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";
import { Header } from "@/components/layout/panel/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <UiSidebarProvider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AppSidebar />
          <SidebarInset>
            {/* ===== Top Heading ===== */}
            <Header>
              <Profile />
            </Header>
            {/* ===== Content ===== */}
            <Main>{children}</Main>
          </SidebarInset>
        </ThemeProvider>
      </UiSidebarProvider>
    </SidebarProvider>
  );
}
