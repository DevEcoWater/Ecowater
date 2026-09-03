"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useZoneQuery } from "@/hooks/zones/use-zones";
import { ZoneRouteConfig } from "@/components/zonas/zone-route-config";
import { getCurrentBimesterRange } from "@/lib/bimester";

export default function ZoneRutaPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const currentBimester = getCurrentBimesterRange();

  const { data: zone, isLoading } = useZoneQuery(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground">Zona no encontrada.</p>
        <Button variant="link" onClick={() => router.push("/dashboard/zonas")}>
          Volver a Zonas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500" />
          <h1 className="text-xl font-semibold">
            Ruta de lectura —{" "}
            <span className="text-muted-foreground font-normal">{zone.name}</span>
          </h1>
        </div>
      </div>

      <ZoneRouteConfig zoneId={id} period={currentBimester} zone={zone} />
    </div>
  );
}
