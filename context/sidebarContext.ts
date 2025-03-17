"use client";
import { createContext, useContext } from "react";

interface SidebarItem {
  title: string;
  url: string;
  isActive: boolean;
}

export interface SidebarContextType {
  navMain: {
    title: string;
    url: string;
    items: SidebarItem[];
  }[];
  setActiveItem: (title: string) => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
};
