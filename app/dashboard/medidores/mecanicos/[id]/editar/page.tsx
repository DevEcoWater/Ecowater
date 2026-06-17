"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import MechanicalMeterForm from "@/components/medidores/mechanical-meter-form";
import { useMeterQuery } from "@/hooks/meters/use-meter-query";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

export default function EditarMedidorMecanicoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: meter, isLoading, isError } = useMeterQuery(id);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !meter) {
    return (
      <div className="max-w-5xl mx-auto py-6">
        <p className="text-destructive">No se pudo cargar el medidor.</p>
      </div>
    );
  }

  if (meter.meter_type !== "MECHANICAL") {
    router.replace(`/dashboard/medidores/${id}`);
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto py-6">
      <MechanicalMeterForm
        meterId={id}
        initialValues={{
          device_name: meter.device_name ?? "",
          street_address: meter.street_address ?? "",
          dev_eui: meter.dev_eui ?? "",
          lat: meter.lat ?? defaultLocation.lat,
          lng: meter.lng ?? defaultLocation.lng,
        }}
      />
    </div>
  );
}
