"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Save, MapPin } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CoordinateMap from "@/components/ui/coordinateMap";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateMechanicalMeterMutation,
  useUpdateMechanicalMeterMutation,
} from "@/hooks/meters/use-meter-query";
import { useZonesQuery } from "@/hooks/zones/use-zones";
import { pointInPolygon, PolygonPoint } from "@/lib/point-in-polygon";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

const formSchema = z.object({
  device_name: z.string().min(1, "El nombre es obligatorio"),
  street_address: z.string().min(1, "La dirección es obligatoria"),
  dev_eui: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface MechanicalMeterFormProps {
  /** When provided the form runs in edit mode for this meter ID. */
  meterId?: string;
  initialValues?: {
    device_name: string;
    street_address: string;
    dev_eui: string;
    lat: number;
    lng: number;
  };
}

export default function MechanicalMeterForm({
  meterId,
  initialValues,
}: MechanicalMeterFormProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const createMeter = useCreateMechanicalMeterMutation();
  const updateMeter = useUpdateMechanicalMeterMutation();
  const { data: zones = [] } = useZonesQuery();

  const isEdit = !!meterId;

  const startLocation = initialValues
    ? { lat: initialValues.lat, lng: initialValues.lng }
    : defaultLocation;

  const [mapCenter, setMapCenter] = useState(startLocation);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_name: initialValues?.device_name ?? "",
      street_address: initialValues?.street_address ?? "",
      dev_eui: initialValues?.dev_eui ?? "",
      coordinates: startLocation,
    },
  });

  const coords = form.watch("coordinates");

  // Derive the zone the current coordinates fall into (geometric, no FK)
  const detectedZone = useMemo(() => {
    if (!zones.length) return null;
    return zones.find((zone) =>
      pointInPolygon(
        coords.lat,
        coords.lng,
        zone.polygon as unknown as PolygonPoint[]
      )
    ) ?? null;
  }, [coords, zones]);

  const handlePlaceSelect = (place: {
    address: string;
    shortData: string;
    location: { lat: number; lng: number };
  }) => {
    form.setValue("street_address", place.address, { shouldValidate: true });
    form.setValue("coordinates", place.location, { shouldValidate: true });
    setMapCenter(place.location);
  };

  const isPending = isEdit ? updateMeter.isPending : createMeter.isPending;

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await updateMeter.mutateAsync({
          id: meterId!,
          device_name: values.device_name,
          street_address: values.street_address,
          dev_eui: values.dev_eui || undefined,
          lat: values.coordinates.lat,
          lng: values.coordinates.lng,
        });
        toast({ title: "Medidor actualizado exitosamente" });
        router.push(`/dashboard/medidores/${meterId}`);
      } else {
        await createMeter.mutateAsync({
          device_name: values.device_name,
          street_address: values.street_address,
          dev_eui: values.dev_eui || undefined,
          lat: values.coordinates.lat,
          lng: values.coordinates.lng,
        });
        toast({ title: "Medidor mecánico creado exitosamente" });
        router.push("/dashboard/medidores");
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar medidor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del medidor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="device_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del medidor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Medidor 142 c/ 505 y 506" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dev_eui"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    ID del medidor{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 0012AB34CD56EF78" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Identificador único para referencia en tablas e informes.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="street_address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <AddressAutocomplete
                      placeholder="Ingrese la dirección del medidor"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onPlaceSelect={handlePlaceSelect}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="text-sm text-muted-foreground">
              Hacé clic en el mapa o arrastrá el marcador para ajustar la ubicación exacta.
              Las zonas se muestran como referencia.
            </p>

            <div className="rounded-md overflow-hidden border">
              <CoordinateMap
                initialLocation={mapCenter}
                height="380px"
                zoom={13}
                zones={zones.map((z) => ({
                  id: z.id,
                  name: z.name,
                  color: z.color,
                  polygon: z.polygon,
                }))}
                onLocationChange={(loc) => {
                  form.setValue("coordinates", { lat: loc.lat, lng: loc.lng });
                  setMapCenter(loc);
                }}
              />
            </div>

            {/* Zone detection badge */}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 shrink-0 text-muted-foreground" />
              {detectedZone ? (
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Zona detectada:</span>
                  <span
                    className="font-medium px-2 py-0.5 rounded-full text-xs"
                    style={{
                      backgroundColor: `${detectedZone.color}22`,
                      color: detectedZone.color,
                      border: `1px solid ${detectedZone.color}55`,
                    }}
                  >
                    {detectedZone.name}
                  </span>
                </span>
              ) : (
                <span className="text-amber-600 text-xs font-medium">
                  Fuera de toda zona — verificá la ubicación
                </span>
              )}
            </div>

            {/* Coordinate readout */}
            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1 text-sm">
              <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-1">
                Coordenadas seleccionadas
              </p>
              <p>
                <span className="text-muted-foreground">Lat:</span>{" "}
                <span className="font-mono">{coords.lat.toFixed(6)}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Lng:</span>{" "}
                <span className="font-mono">{coords.lng.toFixed(6)}</span>
              </p>
            </div>

            {/* Hidden coordinates field — exposes zod validation errors */}
            <FormField
              control={form.control}
              name="coordinates"
              render={() => <FormItem><FormMessage /></FormItem>}
            />
          </CardContent>
        </Card>

        {/* Sticky footer */}
        <div className="sticky bottom-0 z-10 bg-background border-t py-3 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" />
            {isPending
              ? isEdit ? "Guardando..." : "Creando..."
              : isEdit ? "Guardar cambios" : "Crear medidor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
