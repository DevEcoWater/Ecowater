"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OcrScanButton() {
  return (
    <Button
      type="button"
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
    >
      <Camera className="w-4 h-4 mr-2" />
      Escanear Medidor (OCR)
    </Button>
  );
}
