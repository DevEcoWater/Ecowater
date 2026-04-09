"use client";

import { useOperatorZonesQuery } from "@/hooks/portal/use-portal";
import { ZoneCard } from "@/components/portal/zone-card";

export default function PortalZonasPage() {
  const { data: zones, isLoading } = useOperatorZonesQuery();

  return (
    <div className="w-full space-y-3">
      {isLoading && (
        <div className="text-center py-12 text-muted-foreground">Cargando zonas...</div>
      )}
      {!isLoading && (!zones || zones.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          No tenés zonas asignadas.
        </div>
      )}
      {zones?.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}
    </div>
  );
}
