"use client";

import { PageHeader } from "@/components/page-header";
import { usePageHeader } from "@/context/page-header-context";

export function PageHeaderRenderer() {
  const { title, description } = usePageHeader();
  return <PageHeader title={title} description={description} />;
}
