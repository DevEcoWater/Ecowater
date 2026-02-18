"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { PageHeaderContext, defaultPageHeader } from "./page-header-context";

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState(defaultPageHeader.title);
  const [description, setDescription] = useState(defaultPageHeader.description);

  const setPageHeader = useCallback(
    (newTitle: string, newDescription: string) => {
      setTitle(newTitle);
      setDescription(newDescription);
    },
    []
  );

  const value = useMemo(
    () => ({
      title,
      description,
      setPageHeader,
    }),
    [title, description, setPageHeader]
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}
