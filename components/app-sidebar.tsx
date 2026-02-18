"use client";

import React, { useEffect } from "react";
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
import { useSidebar } from "@/components/ui/sidebar"; // ✅ hook from your SidebarProvider
import { motion } from "framer-motion";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: cooperative } = useCooperative();
  const { open, setOpen } = useSidebar();

  let hoverTimeout: NodeJS.Timeout | null = null;

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => setOpen(true), 120);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, []);

  return (
    <motion.div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative z-40 h-svh"
    >
      <Sidebar
        collapsible="icon"
        variant="floating"
        {...props}
        className="h-full duration-200 ease-in-out"
      >
        {/* ===== Header ===== */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="flex items-center gap-2">
                <span className="text-base font-semibold flex items-center gap-2">
                  <Cosego />
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
    </motion.div>
  );
}
