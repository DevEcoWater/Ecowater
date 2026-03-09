"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getPageHeaderFromPath } from "./page-header-route";
import { usePageHeader } from "@/context/page-header-context";

export function PageHeaderInitializer() {
  const pathname = usePathname();
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    const { title, description, tourName } = getPageHeaderFromPath(pathname);
    setPageHeader(title, description, tourName);
  }, [pathname, setPageHeader]);

  return null;
}
