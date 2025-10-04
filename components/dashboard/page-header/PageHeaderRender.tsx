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
      showBackButton={pathname === "/dashboard"}
    />
  );
}
