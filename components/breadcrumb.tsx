"use client";

import React from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useSidebarContext } from "@/context/sidebarContext";

export function BreadcrumbWithContext() {
  const { navMain } = useSidebarContext();
  const activeItem = navMain
    .flatMap((section) => section.items)
    .find((item) => item.isActive);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">Bienvenido Eco Water! 👋</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {activeItem && (
          <BreadcrumbItem>
            <BreadcrumbPage>{activeItem.title}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
