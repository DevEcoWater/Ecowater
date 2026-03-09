"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { PageHeaderContext, defaultPageHeader } from "./page-header-context";

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState(defaultPageHeader.title);
  const [description, setDescription] = useState(defaultPageHeader.description);
  const [tourName, setTourName] = useState<string | null>(null);

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
