"use client";

import { PageHeader } from "@/components/page-header";
import { usePageHeader } from "@/context/page-header-context";
import { usePathname } from "next/navigation";

export function PageHeaderRenderer() {
  const { title, description } = usePageHeader();
  const pathname = usePathname();

  return (
    <PageHeader
      title={title}
      description={description}
      helpVideoUrl="https://firebasestorage.googleapis.com/v0/b/ecowater-dashboard.firebasestorage.app/o/Video%20Demo_EcoWater.mp4?alt=media&token=4ae20fe2-c398-406d-afe3-ae7de0476603"
      helpVideoTitle="Primeros pasos"
      helpVideoDescription="Aprende a como usar la plataforma"
      showBackButton={pathname === "/dashboard"}
    />
  );
}
