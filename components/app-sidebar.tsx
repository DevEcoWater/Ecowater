"use client";

import React from "react";
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
import { sidebarData } from "@/lib/sidebar-data";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";
import { Skeleton } from "./ui/skeleton";
import Cosego from "./cooperative/cosego.svg";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: cooperative } = useCooperative();

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <span className="text-base font-semibold">
                <Cosego />
                {cooperative ? (
                  cooperative.name
                ) : (
                  <Skeleton className="h-6 w-full" />
                )}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
