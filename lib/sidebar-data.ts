import { SidebarData } from "@/types/sidebar/sidebar-types";
import {
  LayoutDashboard,
  ListChecks,
  MapIcon,
  GaugeCircleIcon,
  Settings,
  Wrench,
  Users,
  Layers,
} from "lucide-react";
import { AudioWaveform, Command, GalleryVerticalEnd } from "lucide-react";

export const sidebarData: SidebarData = {
  teams: [
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
  ],
  navGroups: [
    {
      title: "Dashboard",
      items: [
        {
          title: "Principal",
          url: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Medidores",
          url: "/dashboard/medidores",
          icon: GaugeCircleIcon,
        },
        {
          title: "Mapa",
          url: "/dashboard/mapa",
          icon: MapIcon,
        },
        {
          title: "Zonas",
          url: "/dashboard/zonas",
          icon: Layers,
        },
        {
          title: "Usuarios",
          url: "/dashboard/usuarios",
          icon: Users,
        },
      ],
    },
    {
      title: "Otros",
      items: [
        {
          title: "Cooperativa",
          url: "/dashboard/otros/cooperativa",
          icon: Wrench,
        },
      ],
    },
  ],
};
