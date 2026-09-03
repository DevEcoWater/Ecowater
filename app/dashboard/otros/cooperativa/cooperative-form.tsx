"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Mail, Phone, User } from "lucide-react";
import {
  useCooperative,
  useUpdateCooperative,
} from "@/hooks/cooperative/user-cooperative";
import { CooperativeOverviewCards } from "@/components/cooperativa/cooperative-overview-cards";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import CoordinateMap from "@/components/ui/coordinateMap";
import Cosego from "@/components/cooperative/cosego.svg";

// Default map center — fallback when no coordinates are stored
const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

const cooperativeSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  location: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  contact_person: z.string().optional(),
  phone_number: z.string().optional(),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  logo_url: z
    .string()
    .url("URL de logo inválida")
    .optional()
    .or(z.literal("")),
  primary_color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Color hex inválido (ej: #2463EB)")
    .optional()
    .or(z.literal("")),
});

type CooperativeFormData = z.infer<typeof cooperativeSchema>;

export function CooperativeForm() {
  const { toast } = useToast();
  const { data: cooperative, isLoading } = useCooperative();
  const updateCooperative = useUpdateCooperative();

  // Cast to any until Prisma client is regenerated after migration
  const coop = cooperative as any;

  const form = useForm<CooperativeFormData>({
    resolver: zodResolver(cooperativeSchema),
    defaultValues: {
      name: "",
      location: "",
      lat: null,
      lng: null,
      contact_person: "",
      phone_number: "",
      email: "",
      website: "",
      status: "ACTIVE",
      logo_url: "",
      primary_color: "",
    },
  });

  // Populate form on initial load only — skip if the user has unsaved changes
  useEffect(() => {
    if (coop && !form.formState.isDirty) {
      form.reset({
        name: coop.name ?? "",
        location: coop.location ?? "",
        lat: coop.lat ?? null,
        lng: coop.lng ?? null,
        contact_person: coop.contact_person ?? "",
        phone_number: coop.phone_number ?? "",
        email: coop.email ?? "",
        website: coop.website ?? "",
        status: coop.status ?? "ACTIVE",
        logo_url: coop.logo_url ?? "",
        primary_color: coop.primary_color ?? "",
      });
    }
  }, [coop, form]);

  const onSubmit = async (data: CooperativeFormData) => {
    try {
      const updated = await updateCooperative.mutateAsync(data as any);
      const u = updated as any;
      form.reset({
        name: u.name ?? "",
        location: u.location ?? "",
        lat: u.lat ?? null,
        lng: u.lng ?? null,
        contact_person: u.contact_person ?? "",
        phone_number: u.phone_number ?? "",
        email: u.email ?? "",
        website: u.website ?? "",
        status: u.status ?? "ACTIVE",
        logo_url: u.logo_url ?? "",
        primary_color: u.primary_color ?? "",
      });
      toast({
        title: "Éxito",
        description: "La cooperativa ha sido actualizada correctamente",
      });
    } catch {
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar la cooperativa",
        variant: "destructive",
      });
    }
  };

  // Watched values for live previews
  const watchedLat = form.watch("lat");
  const watchedLng = form.watch("lng");
  const watchedLogoUrl = form.watch("logo_url");
  const watchedColor = form.watch("primary_color");
  const watchedStatus = form.watch("status");

  const mapCenter =
    watchedLat && watchedLng
      ? { lat: watchedLat, lng: watchedLng }
      : coop?.lat && coop?.lng
        ? { lat: coop.lat, lng: coop.lng }
        : DEFAULT_CENTER;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* ===== Identity header ===== */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl border bg-muted flex items-center justify-center shrink-0 p-1.5">
          {coop?.logo_url ? (
            <img
              src={coop.logo_url}
              alt={coop.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <Cosego className="w-full h-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold truncate">{coop?.name}</h2>
            <Badge
              variant={coop?.status === "ACTIVE" ? "default" : "secondary"}
              className={
                coop?.status === "ACTIVE"
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }
            >
              {coop?.status === "ACTIVE" ? "Activa" : "Inactiva"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Actualizado el{" "}
            {coop?.updated_at
              ? new Date(coop.updated_at).toLocaleDateString("es-AR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </div>

      {/* ===== KPI overview cards ===== */}
      <CooperativeOverviewCards />

      {/* ===== Form with tabs ===== */}
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="general">
                <TabsList className="mb-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="branding">Personalización</TabsTrigger>
                </TabsList>

                {/* ===== GENERAL TAB ===== */}
                <TabsContent value="general" className="space-y-6" forceMount>
                  {/* Name + Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la cooperativa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la cooperativa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Activa</SelectItem>
                              <SelectItem value="INACTIVE">Inactiva</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Address autocomplete */}
                  <div className="space-y-2">
                    <FormLabel>Ubicación</FormLabel>
                    <Controller
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <AddressAutocomplete
                          value={field.value ?? ""}
                          onChange={(val) => field.onChange(val)}
                          onPlaceSelect={(place) => {
                            field.onChange(place.address);
                            form.setValue("lat", place.location.lat, {
                              shouldDirty: true,
                            });
                            form.setValue("lng", place.location.lng, {
                              shouldDirty: true,
                            });
                          }}
                          placeholder="Buscar dirección de la cooperativa"
                        />
                      )}
                    />
                    {form.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.location.message}
                      </p>
                    )}
                  </div>

                  {/* Map preview */}
                  <div className="rounded-lg overflow-hidden border">
                    <CoordinateMap
                      initialLocation={mapCenter}
                      readOnly
                      height="220px"
                      zoom={13}
                    />
                  </div>

                  {/* Contact info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contact_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Persona de contacto
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            Teléfono
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="+54 11 1234-5678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            Email de contacto
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contacto@cooperativa.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            Sitio web
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://cooperativa.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* ===== BRANDING TAB ===== */}
                <TabsContent value="branding" className="space-y-6">
                  {/* Logo URL */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Logo
                    </h3>
                    <FormField
                      control={form.control}
                      name="logo_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del logo</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              placeholder="https://ejemplo.com/logo.png"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Ingresá la URL pública de una imagen (PNG, SVG, WebP).
                          </p>
                        </FormItem>
                      )}
                    />

                    {/* Logo preview */}
                    {watchedLogoUrl && (
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded-xl border bg-muted flex items-center justify-center overflow-hidden">
                          <img
                            src={watchedLogoUrl}
                            alt="Vista previa del logo"
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Vista previa del logo
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Color picker */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Color primario
                    </h3>
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color de la cooperativa</FormLabel>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={
                                field.value && /^#[0-9A-Fa-f]{6}$/.test(field.value)
                                  ? field.value
                                  : "#2463EB"
                              }
                              onChange={(e) =>
                                field.onChange(e.target.value)
                              }
                              className="h-10 w-10 cursor-pointer rounded border border-input p-0.5 bg-background shrink-0"
                            />
                            <FormControl>
                              <Input
                                placeholder="#2463EB"
                                {...field}
                                className="font-mono"
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Se aplica a botones, badges y acentos en toda la
                            plataforma. Guardá para ver el cambio en vivo.
                          </p>
                        </FormItem>
                      )}
                    />

                    {/* Color preview */}
                    {watchedColor &&
                      /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(watchedColor) && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                          <p className="text-xs text-muted-foreground shrink-0">Vista previa:</p>
                          <Button
                            type="button"
                            size="sm"
                            style={{ backgroundColor: watchedColor, color: "#fff" }}
                            className="border-0 shadow-none"
                          >
                            Botón primario
                          </Button>
                          <Badge
                            style={{
                              backgroundColor: `${watchedColor}22`,
                              color: watchedColor,
                              borderColor: `${watchedColor}55`,
                            }}
                            variant="outline"
                          >
                            Activo
                          </Badge>
                        </div>
                      )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Submit */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updateCooperative.isPending}
                  className="w-full sm:w-[200px]"
                >
                  {updateCooperative.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
