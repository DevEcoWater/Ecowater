"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOcrMutation } from "@/hooks/portal/use-portal";

interface OcrScanButtonProps {
  meterId: string;
  attemptCount: number;
  maxAttempts?: number;
  onStart: () => void;
  onSuccess: (value: string, imagePath: string) => void;
  onFailure: (imagePath: string, error: string) => void;
  disabled?: boolean;
}

export function OcrScanButton({
  meterId,
  attemptCount,
  maxAttempts = 3,
  onStart,
  onSuccess,
  onFailure,
  disabled,
}: OcrScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const ocrMutation = useOcrMutation(meterId);

  const isDisabled = disabled || attemptCount >= maxAttempts || ocrMutation.isPending;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    onStart();
    try {
      const result = await ocrMutation.mutateAsync(file);
      if (result.value) {
        onSuccess(result.value, result.image_path);
      } else {
        onFailure(result.image_path, result.error ?? "OCR no detectó un valor");
      }
    } catch {
      onFailure("", "Error de red al procesar la imagen");
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={isDisabled}
        onClick={() => inputRef.current?.click()}
      >
        {ocrMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando imagen...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Escanear medidor (OCR)
          </>
        )}
      </Button>
    </>
  );
}
