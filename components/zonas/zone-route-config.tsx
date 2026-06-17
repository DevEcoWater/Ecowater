"use client";

import { Gauge, HardHat, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useZoneReadingRouteQuery } from "@/hooks/zones/use-zones";
import { Zone } from "@/types/zones/zone-types";
import { ZoneRouteMap } from "@/components/zonas/zone-route-map";
import Link from "next/link";

interface ZoneRouteConfigProps {
  zoneId: string;
  period: { startDate: string; endDate: string };
  zone: Zone;
}

export function ZoneRouteConfig({ zoneId, period, zone }: ZoneRouteConfigProps) {
  const { data: routeData, isLoading } = useZoneReadingRouteQuery(zoneId, period);

  const completedAt = routeData?.completed_at
    ? new Date(routeData.completed_at).toLocaleString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const hasOperators = (routeData?.operator_count ?? 0) > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Ruta de lectura
      </h2>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total meters */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center gap-4">
            <Gauge className="w-8 h-8 text-blue-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{routeData?.total ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Medidores mecánicos</p>
            </div>
          </CardContent>
        </Card>

        {/* Operators */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-purple-500">
          <CardContent className="p-4 flex items-center gap-4">
            <HardHat className="w-8 h-8 text-purple-500 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{routeData?.operator_count ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Operarios asignados</p>
            </div>
          </CardContent>
        </Card>

        {/* Completion */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center gap-4">
            <MapPin className="w-8 h-8 text-amber-500 shrink-0" />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground">Estado del período</p>
              {routeData?.completed ? (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 w-fit text-xs">
                  Completada{completedAt ? ` ${completedAt}` : ""}
                </Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 w-fit text-xs">
                  Pendiente
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No operators warning */}
      {!isLoading && !hasOperators && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Asigná operarios a esta zona antes de configurar la ruta.{" "}
          <Link
            href={`/dashboard/zonas/${zoneId}`}
            className="underline font-medium hover:text-amber-900"
          >
            Ir al detalle de zona
          </Link>
        </div>
      )}

      {/* Route map / builder */}
      {!isLoading && routeData?.meters.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No hay medidores mecánicos en esta zona.
        </p>
      )}

      {!isLoading && routeData && routeData.meters.length > 0 && (
        <ZoneRouteMap
          zoneId={zoneId}
          polygon={zone.polygon}
          meters={routeData.meters}
          operators={routeData.operators ?? []}
          initialRouteOrder={zone.route_order ?? null}
          initialAssignments={zone.route_assignments ?? null}
        />
      )}
    </div>
  );
}
