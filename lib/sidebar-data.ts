import { SidebarData } from "@/types/sidebar/sidebar-types";
import {
  LayoutDashboard, // IconLayoutDashboard
  ListChecks, // IconChecklist
  MapIcon,
  GaugeCircleIcon,
  Settings, // IconSettings
  Wrench, // IconTool
  Users, // IconUsers
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
          url: "/",
          icon: LayoutDashboard,
        },
        {
          title: "Medidores",
          url: "/dashbard/medidores",
          icon: GaugeCircleIcon,
        },
        {
          title: "Mapa",
          url: "/dashboard/mapa",
          // badge: "3",
          icon: MapIcon,
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
          title: "Cuenta",
          url: "/settings/account",
          icon: Wrench,
        },
      ],
    },
  ],
};
