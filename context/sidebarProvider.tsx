"use client";
import React, { useState, ReactNode } from "react";
import { SidebarContext, SidebarContextType } from "./sidebarContext";

const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [navMain, setNavMain] = useState<SidebarContextType["navMain"]>([
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Medidores",
          url: "/dashboard",
          isActive: true,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          isActive: false,
        },
        {
          title: "Mapa",
          url: "/dashboard/mapa",
          isActive: false,
        },
      ],
    },
  ]);

  const setActiveItem = (title: string) => {
    setNavMain((prevNavMain) => {
      return prevNavMain.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.title === title
            ? { ...item, isActive: true }
            : { ...item, isActive: false }
        ),
      }));
    });
  };

  return (
    <SidebarContext.Provider value={{ navMain, setActiveItem }}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarProvider;
