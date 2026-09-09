"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PageHeaderContext } from "./page-header-context";
import { getPageHeaderFromPath } from "@/components/dashboard/page-header/page-header-route";

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const initial = getPageHeaderFromPath(pathname);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [tourName, setTourName] = useState<string | null>(initial.tourName ?? null);

  const setPageHeader = useCallback(
    (newTitle: string, newDescription: string, newTourName?: string | null) => {
      setTitle(newTitle);
      setDescription(newDescription);
      setTourName(newTourName ?? null);
    },
    []
  );

  const value = useMemo(
    () => ({
      title,
      description,
      tourName,
      setPageHeader,
    }),
    [title, description, tourName, setPageHeader]
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}
