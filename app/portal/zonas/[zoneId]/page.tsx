"use client";

import { useParams } from "next/navigation";
import { CheckCircle2, Gauge } from "lucide-react";
import { useReadingRouteQuery } from "@/hooks/portal/use-portal";
import { ReadingRouteItemCard } from "@/components/portal/reading-route-item";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReadingRoutePage() {
  const { zoneId } = useParams() as { zoneId: string };
  const { data, isLoading } = useReadingRouteQuery(zoneId);

  const readCount = data?.read_count ?? 0;
  const total = data?.total ?? 0;
  const zoneTotal = data?.zone_total ?? total;
  const progress = total > 0 ? (readCount / total) * 100 : 0;
  const allDone = total > 0 && readCount === total;

  const pending = data?.meters.filter((m) => !m.read_today) ?? [];
  const done = data?.meters.filter((m) => m.read_today) ?? [];

  return (
    <div className="w-full space-y-4">

      {/* Assignment summary card */}
      {!isLoading && zoneTotal > 0 && (
        <div className="rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Gauge className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {total > 0
                    ? `${total} de ${zoneTotal} medidores asignados a vos`
                    : "Sin medidores asignados aún"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {readCount > 0
                    ? `${readCount} leído${readCount !== 1 ? "s" : ""} hoy`
                    : "Ninguno leído hoy"}
                </p>
              </div>
            </div>

            {total > 0 && (
              allDone ? (
                <span className="flex items-center gap-1 text-sm font-bold text-green-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                  Completo
                </span>
              ) : (
                <span className="text-lg font-bold text-blue-600 shrink-0 tabular-nums">
                  {Math.round(progress)}%
                </span>
              )
            )}
          </div>

          {/* Progress bar */}
          {total > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    allDone ? "bg-green-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">
                {readCount} / {total}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-[72px] w-full rounded-xl" />
          <Skeleton className="h-[72px] w-full rounded-xl" />
          <Skeleton className="h-[72px] w-full rounded-xl" />
        </div>
      )}

      {!isLoading && total === 0 && zoneTotal === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay medidores mecánicos en esta zona.
        </div>
      )}

      {!isLoading && total === 0 && zoneTotal > 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No tenés medidores asignados en esta zona todavía.
        </div>
      )}

      {/* Pending */}
      {!isLoading && pending.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            Pendientes ({pending.length})
          </p>
          {pending.map((item) => (
            <ReadingRouteItemCard key={item.id} item={item} zoneId={zoneId} />
          ))}
        </>
      )}

      {/* Done */}
      {!isLoading && done.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mt-2">
            Leídos hoy ({done.length})
          </p>
          {done.map((item) => (
            <ReadingRouteItemCard key={item.id} item={item} zoneId={zoneId} />
          ))}
        </>
      )}
    </div>
  );
}
