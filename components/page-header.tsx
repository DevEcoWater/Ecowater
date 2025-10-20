"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { VideoHelpModal } from "@/components/video-help-modal";

interface PageHeaderProps {
  title: string;
  description: string;
  showBackButton?: boolean;
  useHistoryBack?: boolean;
  helpVideoUrl?: string;
  helpVideoTitle?: string;
  helpVideoDescription?: string;
}

export function PageHeader({
  title,
  description,
  showBackButton = true,
  useHistoryBack = false,
  helpVideoUrl,
  helpVideoTitle,
  helpVideoDescription,
}: PageHeaderProps) {
  const router = useRouter();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const handleBack = () => {
    if (useHistoryBack) {
      window.history.back();
    } else {
      router.back();
    }
  };

  return (
    <>
      <div className="flex flex-col justify-start items-start gap-4">
        <div className="flex items-center justify-between w-full gap-4">
          <div className="flex items-center gap-4">
            {showBackButton ||
              (window.history.back && (
                <Button variant="outline" onClick={handleBack}>
                  {!useHistoryBack && <ArrowLeft className="mr-2 h-4 w-4" />}
                  Volver
                </Button>
              ))}
          </div>
        </div>
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
          {helpVideoUrl && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsHelpModalOpen(true)}
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {helpVideoUrl && (
        <VideoHelpModal
          open={isHelpModalOpen}
          onOpenChange={setIsHelpModalOpen}
          videoUrl={helpVideoUrl}
          title={helpVideoTitle}
          description={helpVideoDescription}
        />
      )}
    </>
  );
}
