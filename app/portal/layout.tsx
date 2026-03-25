import "../globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { SidebarInset, SidebarProvider as UiSidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cn } from "@/lib/utils";
import { PageHeaderInitializer } from "@/components/dashboard/page-header/page-header-initializer";
import { PageHeaderRenderer } from "@/components/dashboard/page-header/PageHeaderRender";
import { Header } from "@/components/layout/panel/header";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";
import { Separator } from "@/components/ui/separator";
import { PageHeaderProvider } from "@/context/page-header-provider";
import { AuthGuard } from "@/components/auth/auth-guard";
import { TourProvider } from "@/components/layout/panel/tour-provider";
import { PageTransition } from "@/components/layout/panel/page-transition";
import { configureDayjs } from "@/utils/configureDayjs";

configureDayjs();

export const metadata = {
  title: "Portal Operario - EcoWater",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true}>
      <TourProvider>
        <UiSidebarProvider defaultOpen={false}>
          <ThemeProvider attribute="class" defaultTheme="light">
            <AppSidebar />
            <SidebarInset>
              <div
                id="content"
                className={cn(
                  "w-full",
                  "flex h-svh flex-col",
                  "group-data-[scroll-locked=1]/body:h-full",
                  "group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh"
                )}
              >
                <Header fixed>
                  <div className="flex w-full items-center justify-end">
                    <Profile />
                  </div>
                </Header>

                <PageHeaderProvider>
                  <PageHeaderInitializer />
                  <Main>
                    <PageHeaderRenderer />
                    <Separator className="my-4 lg:my-6" />
                    <div className="flex flex-1 flex-col space-y-2 md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0">
                      <div className="flex w-full overflow-y-auto pr-2 sm:pr-4">
                        <PageTransition>{children}</PageTransition>
                      </div>
                    </div>
                  </Main>
                </PageHeaderProvider>
              </div>
            </SidebarInset>
          </ThemeProvider>
        </UiSidebarProvider>
      </TourProvider>
    </AuthGuard>
  );
}
