"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import CoordinateMap from "@/components/ui/coordinateMap";
import { useToast } from "@/hooks/use-toast";
import { useCreateMechanicalMeterMutation } from "@/hooks/meters/use-meter-query";
import { useZonesQuery } from "@/hooks/zones/use-zones";
import { clientConfig } from "@/config/client.config";

const defaultLocation = clientConfig.geo.defaultLocation;

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

export default function MechanicalMeterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const createMeter = useCreateMechanicalMeterMutation();
  const { data: zones = [] } = useZonesQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      device_name: "",
      street_address: "",
      dev_eui: "",
      coordinates: defaultLocation,
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMeter.mutateAsync({
        device_name: values.device_name,
        street_address: values.street_address,
        dev_eui: values.dev_eui || undefined,
        lat: values.coordinates.lat,
        lng: values.coordinates.lng,
      });
      toast({ title: "Medidor mecánico creado exitosamente" });
      router.push("/dashboard/medidores");
    } catch (error: any) {
      toast({
        title: "Error al crear medidor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const coords = form.watch("coordinates");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo Medidor Mecánico</CardTitle>
            <CardDescription>
              Registra un medidor de lectura manual en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: fields */}
              <div className="space-y-4">
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
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Calle 142 c/ 505 y 506" {...field} />
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

                <Separator />

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                  <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">Coordenadas seleccionadas</p>
                  <p>
                    <span className="text-muted-foreground">Lat:</span>{" "}
                    <span className="font-mono">{coords.lat.toFixed(6)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Lng:</span>{" "}
                    <span className="font-mono">{coords.lng.toFixed(6)}</span>
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="coordinates"
                  render={() => <FormItem><FormMessage /></FormItem>}
                />
              </div>

              {/* Right: map */}
              <div className="space-y-2">
                <FormLabel>Ubicación en el mapa</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Hacé clic en el mapa o arrastrá el marcador para definir la ubicación. Las zonas se muestran como referencia.
                </p>
                <CoordinateMap
                  initialLocation={defaultLocation}
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
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={createMeter.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {createMeter.isPending ? "Guardando..." : "Guardar Medidor"}
        </Button>
      </form>
    </Form>
  );
}
