"use client";

import { PageHeaderInitializer } from "@/components/dashboard/page-header/page-header-initializer";
import { PageHeaderRenderer } from "@/components/dashboard/page-header/PageHeaderRender";
import { Header } from "@/components/layout/panel/header";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";
import { Separator } from "@/components/ui/separator";
import { PageHeaderProvider } from "@/context/page-header-provider";
import type { ReactNode } from "react";

interface UsuariosLayoutProps {
  children: ReactNode;
}

export default function MetersLayout({ children }: UsuariosLayoutProps) {
  return (
    <>
      <Header fixed>
        <div className="flex w-full items-center justify-end border-red-500 border-1">
          <Profile />
        </div>
      </Header>

      <PageHeaderProvider>
        <PageHeaderInitializer />
        <Main>
          <PageHeaderRenderer />
          <Separator className="my-4 lg:my-6" />
          <div className="flex flex-1 flex-col space-y-2 md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0 h-full">
            <div className="flex w-full overflow-y-auto p-1 pr-4">
              <div className="flex flex-1 flex-col">{children}</div>
            </div>
          </div>
        </Main>
      </PageHeaderProvider>
    </>
  );
}
