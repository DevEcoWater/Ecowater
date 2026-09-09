"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useOcrMutation } from "@/hooks/portal/use-portal";
import { compressImage } from "@/utils/compressImage";

interface OcrScanButtonProps {
  meterId: string;
  /** Called immediately after the image is compressed, before OCR runs. */
  onImageCaptured: (dataUri: string) => void;
  /** Called when OCR successfully reads a numeric value from the image. */
  onOcrResult: (value: string) => void;
  /** Called when OCR fails to read a value or encounters an error. */
  onOcrFailure: () => void;
  /** Button label. Defaults to "Escanear Medidor". */
  label?: string;
  disabled?: boolean;
}

export function OcrScanButton({
  meterId,
  onImageCaptured,
  onOcrResult,
  onOcrFailure,
  label = "Escanear Medidor",
  disabled = false,
}: OcrScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const ocrMutation = useOcrMutation(meterId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected on retry
    e.target.value = "";

    // Compress before sending to OCR and storing
    let dataUri: string;
    try {
      dataUri = await compressImage(file);
    } catch {
      toast({ title: "Error al procesar la imagen", variant: "destructive" });
      onOcrFailure();
      return;
    }

    // Always report the captured image to the parent (even if OCR fails later)
    onImageCaptured(dataUri);

    // Strip the data-URI prefix — OCR endpoint expects raw base64
    const base64 = dataUri.split(",")[1];

    ocrMutation.mutate(base64, {
      onSuccess: (data) => {
        if (data.value) {
          onOcrResult(data.value);
          toast({ title: `Lectura detectada: ${data.value}` });
        } else {
          toast({
            title: "No se pudo leer el valor",
            description: data.rawText
              ? `Texto detectado: "${data.rawText.slice(0, 60)}"`
              : "Intentá de nuevo con mejor iluminación",
            variant: "destructive",
          });
          onOcrFailure();
        }
      },
      onError: () => {
        toast({ title: "Error al procesar la imagen", variant: "destructive" });
        onOcrFailure();
      },
    });
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
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => inputRef.current?.click()}
        disabled={ocrMutation.isPending || disabled}
      >
        {ocrMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>
    </>
  );
}
