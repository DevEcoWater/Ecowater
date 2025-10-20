"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface VideoHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title?: string;
  description?: string;
}

export function VideoHelpModal({
  open,
  onOpenChange,
  videoUrl,
  title = "Help Video",
  description = "Watch this video for guidance",
}: VideoHelpModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setIsLoading(true);
      setHasError(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full relative bg-muted rounded-lg overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>Fallo al cargar el video, por favor recargue la página</p>
            </div>
          )}

          <video
            src={videoUrl}
            controls
            className="w-full h-full rounded-lg"
            controlsList="nodownload"
            preload="metadata"
            playsInline
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          >
            Tu navegador no soporta el elemento <code>video</code>
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
