import { SidebarData } from "@/types/sidebar/sidebar-types";
import {
  LayoutDashboard,
  MapIcon,
  GaugeCircleIcon,
  Settings,
  Wrench,
  Users,
  Layers,
  HardHat,
  Home,
} from "lucide-react";
import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react";

const TEAMS = [
  {
    name: "Shadcn Admin",
    logo: Command,
    plan: "Vite + ShadcnUI",
  },
  {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    logo: AudioWaveform,
    plan: "Startup",
  },
];

export function getSidebarData(role?: string): SidebarData {
  if (role === "operario") {
    return {
      teams: TEAMS,
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
      teams: TEAMS,
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
    teams: TEAMS,
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
        title: "Otros",
        items: [
          { title: "Cooperativa", url: "/dashboard/otros/cooperativa", icon: Wrench },
        ],
      },
    ],
  };
}

// Backward-compatible export for any legacy imports
export const sidebarData: SidebarData = getSidebarData();
