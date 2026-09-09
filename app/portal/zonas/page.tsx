"use client";

import { useOperatorZonesQuery } from "@/hooks/portal/use-portal";
import { ZoneCard } from "@/components/portal/zone-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

export default function PortalZonasPage() {
  const { data: zones, isLoading } = useOperatorZonesQuery();

  return (
    <div className="w-full space-y-3">
      {isLoading && (
        <>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </>
      )}
      {!isLoading && (!zones || zones.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="p-4 bg-gray-100 rounded-full">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Sin zonas asignadas</p>
            <p className="text-sm text-gray-500 mt-1">
              Contactá a tu supervisor para que te asigne una zona.
            </p>
          </div>
        </div>
      )}
      {zones?.map((zone) => (
        <ZoneCard key={zone.id} zone={zone} />
      ))}
    </div>
  );
}
