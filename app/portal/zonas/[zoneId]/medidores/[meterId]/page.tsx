"use client";

import { useParams } from "next/navigation";
import { useReadingRouteQuery } from "@/hooks/portal/use-portal";
import { ManualReadingForm } from "@/components/portal/manual-reading-form";
import { useSession } from "next-auth/react";

export default function MeterReadingPage() {
  const { zoneId, meterId } = useParams() as { zoneId: string; meterId: string };
  const { data: session } = useSession();
  const { data: routeData, isLoading } = useReadingRouteQuery(zoneId);

  const meter = routeData?.meters.find((m) => m.id === meterId);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">Cargando...</div>
    );
  }

  if (!meter) {
    return (
      <p className="text-muted-foreground">Medidor no encontrado.</p>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <ManualReadingForm
        meterId={meterId}
        zoneId={zoneId}
        meterName={meter.street_address ?? meter.device_name}
        userName={meter.userName}
        lastReadingValue={meter.last_reading_value}
        lastReadingDate={meter.last_reading_date ? String(meter.last_reading_date) : null}
        userId={session?.user?.id ?? ""}
      />
    </div>
  );
}
