import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorsCardProps {
  totalErrors: number;
  color: string;
  backgroundColor: string;
}

export function ErrorsCard({
  totalErrors,
  color,
  backgroundColor,
}: ErrorsCardProps) {
  const getErrorText = (count: number) => {
    if (count === 0) return "Sin errores";
    if (count < 3) return "Pocos errores";
    return "Muchos errores";
  };

  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Errores</p>
            <p style={{ color: color }} className="text-3xl font-bold mt-2">
              {totalErrors}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getErrorText(totalErrors)}
            </p>
          </div>
          <div
            style={{ backgroundColor: backgroundColor }}
            className={`p-3 rounded-lg`}
          >
            <AlertCircle style={{ color: color }} className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
