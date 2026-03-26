import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Wrench } from "lucide-react";
import Link from "next/link";

interface MeterTypesCardProps {
  smart: number;
  mechanical: number;
}

export function MeterTypesCard({ smart, mechanical }: MeterTypesCardProps) {
  const total = smart + mechanical;

  return (
    <Link href="/dashboard/medidores" className="h-full block">
      <Card className="p-6 border-0 shadow-sm bg-white dark:bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-purple-500 h-full">
        <CardContent className="p-0 h-full flex flex-col justify-between">
          <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground mb-3">
            Tipos de medidor
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600 dark:text-muted-foreground">Inteligentes</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{smart}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-100">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-sm text-gray-600 dark:text-muted-foreground">Mecánicos</span>
              </div>
              <span className="text-sm font-bold text-amber-600">{mechanical}</span>
            </div>
            {total > 0 && (
              <div className="mt-1 h-1.5 bg-gray-100 dark:bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(smart / total) * 100}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${(mechanical / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
