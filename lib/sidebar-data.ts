import { SidebarData } from "@/types/sidebar/sidebar-types";
import {
  LayoutDashboard,
  MapIcon,
  GaugeCircleIcon,
  Wrench,
  Users,
  Layers,
  HardHat,
  Home,
  CreditCard,
} from "lucide-react";

export function getSidebarData(role?: string): SidebarData {
  if (role === "operario") {
    return {
      navGroups: [
        {
          title: "Portal Operario",
          items: [
            { title: "Inicio", url: "/portal", icon: Home },
            { title: "Mis Zonas", url: "/portal/zonas", icon: MapIcon },
          ],
        },
      ],
    };
  }

  if (role === "lector") {
    return {
      navGroups: [
        {
          title: "Dashboard",
          items: [
            { title: "Mapa", url: "/dashboard/mapa", icon: MapIcon },
            { title: "Zonas", url: "/dashboard/zonas", icon: Layers },
          ],
        },
      ],
    };
  }

  const isAdminOrSupervisor = role === "admin" || role === "supervisor";

  return {
    navGroups: [
      {
        title: "Dashboard",
        items: [
          { title: "Principal", url: "/dashboard", icon: LayoutDashboard },
          { title: "Medidores", url: "/dashboard/medidores", icon: GaugeCircleIcon },
          { title: "Mapa", url: "/dashboard/mapa", icon: MapIcon },
          { title: "Zonas", url: "/dashboard/zonas", icon: Layers },
          { title: "Usuarios", url: "/dashboard/usuarios", icon: Users },
          ...(isAdminOrSupervisor
            ? [{ title: "Operarios", url: "/dashboard/operarios", icon: HardHat }]
            : []),
        ],
      },
      {
        title: "Gestión",
        items: [
          { title: "Planes", url: "/dashboard/planes", icon: CreditCard },
          { title: "Cooperativa", url: "/dashboard/otros/cooperativa", icon: Wrench },
        ],
      },
    ],
  };
}

// Backward-compatible export for any legacy imports
export const sidebarData: SidebarData = getSidebarData();
