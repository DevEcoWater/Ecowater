"use client";

import React, { useRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavGroup } from "./sidebar/nav-group";
import { getSidebarData } from "@/lib/sidebar-data";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";
import { Skeleton } from "./ui/skeleton";
import Cosego from "./cooperative/cosego.svg";
import { useSidebar } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: cooperative } = useCooperative();
  const { open, setOpen } = useSidebar();
  const { data: session } = useSession();
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const role = session?.user?.role;
  const sidebarData = getSidebarData(role);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setOpen(true), 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => setOpen(false), 200);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative z-40 h-svh"
    >
      <Sidebar
        collapsible="icon"
        variant="floating"
        {...props}
        className="h-full"
      >
        {/* ===== Header ===== */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="flex items-center gap-2">
                <span className="text-base font-semibold flex items-center gap-2">
                  {(cooperative as any)?.logo_url ? (
                    <img
                      src={(cooperative as any).logo_url}
                      alt={cooperative!.name}
                      className="h-6 w-6 rounded object-contain shrink-0"
                    />
                  ) : (
                    <Cosego />
                  )}
                  {open &&
                    (cooperative ? (
                      cooperative.name
                    ) : (
                      <Skeleton className="h-6 w-full" />
                    ))}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ===== Navigation ===== */}
        <SidebarContent>
          {sidebarData.navGroups.map((group) => (
            <NavGroup key={group.title} {...group} />
          ))}
        </SidebarContent>
      </Sidebar>
    </div>
  );
}
