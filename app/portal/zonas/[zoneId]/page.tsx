"use client";

import { useParams } from "next/navigation";
import { useReadingRouteQuery } from "@/hooks/portal/use-portal";
import { ReadingRouteItemCard } from "@/components/portal/reading-route-item";

export default function ReadingRoutePage() {
  const { zoneId } = useParams() as { zoneId: string };
  const { data, isLoading } = useReadingRouteQuery(zoneId);

  const readCount = data?.read_count ?? 0;
  const total = data?.total ?? 0;
  const progress = total > 0 ? (readCount / total) * 100 : 0;

  return (
    <div className="w-full space-y-4">
      {/* Progress bar */}
      {!isLoading && total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="text-muted-foreground">Progreso de lectura</span>
            <span className="font-medium">{readCount} / {total} medidores</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Cargando medidores...</div>
      )}
      {!isLoading && total === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay medidores mecánicos en esta zona.
        </div>
      )}
      {data?.meters.map((item) => (
        <ReadingRouteItemCard key={item.id} item={item} zoneId={zoneId} />
      ))}
    </div>
  );
}
