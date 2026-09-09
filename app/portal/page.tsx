"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOperatorZonesQuery } from "@/hooks/portal/use-portal";
import { ZoneCard } from "@/components/portal/zone-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Map, Wrench, ArrowRight, ClipboardCheck, CheckCircle2 } from "lucide-react";

export default function PortalHomePage() {
  const { data: session } = useSession();
  const { data: zones, isLoading } = useOperatorZonesQuery();
  const router = useRouter();

  const firstName = session?.user?.name?.split(" ")[0] ?? "Operario";

  const activeZones   = zones?.filter((z) => z.status === "ACTIVE").length ?? 0;
  const totalAssigned = zones?.reduce((sum, z) => sum + z.assigned_count, 0) ?? 0;
  const totalReadToday = zones?.reduce((sum, z) => sum + z.read_count_today, 0) ?? 0;
  const allDoneToday  = totalAssigned > 0 && totalReadToday >= totalAssigned;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div id="tour-portal-home" className="w-full space-y-6">

      {/* Welcome banner */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{greeting}, {firstName}</h2>
              <p className="text-blue-100 text-sm mt-1">
                {new Date().toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
              {!isLoading && totalAssigned > 0 && (
                allDoneToday ? (
                  <p className="text-blue-100 text-sm mt-2 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Completaste todas tus lecturas de hoy
                  </p>
                ) : (
                  <p className="text-blue-100 text-sm mt-2 font-medium">
                    {totalReadToday} de {totalAssigned} lecturas completadas
                  </p>
                )
              )}
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <ClipboardCheck className="w-7 h-7 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div id="tour-portal-stats" className="grid grid-cols-3 gap-3">
        {/* Active zones */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="p-1.5 rounded-lg bg-blue-100 w-fit">
                <Map className="w-3.5 h-3.5 text-blue-600" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-6 mt-0.5" />
              ) : (
                <p className="text-xl font-bold">{activeZones}</p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">Zonas activas</p>
            </div>
          </CardContent>
        </Card>

        {/* Assigned meters */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="p-1.5 rounded-lg bg-amber-100 w-fit">
                <Wrench className="w-3.5 h-3.5 text-amber-600" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-6 mt-0.5" />
              ) : (
                <p className="text-xl font-bold">{totalAssigned}</p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">Asignados</p>
            </div>
          </CardContent>
        </Card>

        {/* Read today */}
        <Card className="border-0 shadow-sm bg-white dark:bg-card border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex flex-col gap-1">
              <div className="p-1.5 rounded-lg bg-green-100 w-fit">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-6 mt-0.5" />
              ) : (
                <p className={`text-xl font-bold ${allDoneToday ? "text-green-600" : ""}`}>
                  {totalReadToday}
                </p>
              )}
              <p className="text-xs text-muted-foreground leading-tight">Leídos hoy</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zones section */}
      <div id="tour-portal-zones">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Mis zonas
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1"
            onClick={() => router.push("/portal/zonas")}
          >
            Ver todas <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading && (
            <>
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </>
          )}
          {!isLoading && zones?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tenés zonas asignadas.
            </p>
          )}
          {zones?.slice(0, 3).map((zone) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
          {(zones?.length ?? 0) > 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/portal/zonas")}
            >
              Ver {zones!.length - 3} zona{zones!.length - 3 > 1 ? "s" : ""} más
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
