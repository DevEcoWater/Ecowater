import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorsCardProps {
  totalErrors: number;
}

export function ErrorsCard({ totalErrors }: ErrorsCardProps) {
  const getErrorLevel = (count: number) => {
    if (count === 0) return "text-green-600 bg-green-100";
    if (count < 3) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

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
            <p className="text-3xl font-bold text-red-600 mt-2">
              {totalErrors}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getErrorText(totalErrors)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${getErrorLevel(totalErrors)}`}>
            <AlertCircle className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
