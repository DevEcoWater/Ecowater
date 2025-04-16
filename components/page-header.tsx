"use client";

import { Button } from "@/components/ui/button";
import { usePageHeader } from "@/context/page-header-context";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
  useHistoryBack?: boolean;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  useHistoryBack = false,
}: PageHeaderProps) {
  const router = useRouter();
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader(title, description);
  }, [title, description, setPageHeader]);

  const handleBack = () => {
    if (useHistoryBack) {
      window.history.back();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {showBackButton && (
        <Button variant="outline" onClick={handleBack}>
          {!useHistoryBack && <ArrowLeft className="mr-2 h-4 w-4" />}
          Volver
        </Button>
      )}
    </div>
  );
}
