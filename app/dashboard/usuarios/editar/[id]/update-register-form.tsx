"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Autocomplete } from "@react-google-maps/api";
import {
  useUserQuery,
  useUpdateUserMutation,
} from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, AlertCircle } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import UserLocationMap from "@/components/usuarios/map";
import { UserStatus } from "@prisma/client";
import { useMeterMutation } from "@/hooks/meters/user-meter-query";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

// Define form schema with Zod
const formSchema = z.object({
  firstName: z.string().min(1, "Este campo es obligatorio"),
  lastName: z.string().min(1, "Este campo es obligatorio"),
  email: z.string().email("Ingrese un email válido"),
  address: z.string().min(1, "Debe seleccionar una ubicación válida"),
  password: z.string().optional(),
  status: z.nativeEnum(UserStatus),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

declare global {
  interface Window {
    google: any;
  }
}

export default function UpdateUserForm() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const userId = params.id as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      password: "",
      status: UserStatus.ACTIVE,
      coordinates: defaultLocation,
    },
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);

  const { mutate: updateUser, isPending: isUpdatingUser } =
    useUpdateUserMutation();
  const { mutate: updateMeter, isPending: isUpdatingMeter } =
    useMeterMutation();

  useEffect(() => {
    if (userData && !isLoadingUser) {
      form.reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        address: userData.address || "",
        password: "",
        status: userData.status || "ACTIVE",
        coordinates: userData.coordinates || defaultLocation,
      });

      setOriginalStatus(userData.status);

      if (
        userData.coordinates &&
        typeof userData.coordinates.lat === "number" &&
        typeof userData.coordinates.lng === "number"
      ) {
        setMapCenter({
          lat: userData.coordinates.lat,
          lng: userData.coordinates.lng,
        });
      }
    }
  }, [userData, isLoadingUser, form]);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.geometry) {
        const location = {
          lat: place.geometry.location!.lat(),
          lng: place.geometry.location!.lng(),
        };

        setMapCenter(location);
        form.setValue("coordinates", location);
        form.setValue("address", place.formatted_address || "", {
          shouldValidate: true,
        });
      }
    }
  };

  const handleLocationChange = (location: { lat: number; lng: number }) => {
    form.setValue("coordinates", location);
  };

  const onSubmit = (data: FormValues) => {
    const updateData = { ...data };
    if (!updateData.password) {
      delete updateData.password;
    }
    if (
      updateData.coordinates?.lat != null &&
      updateData.coordinates?.lng != null
    ) {
      updateUser(
        { id: userId, ...updateData },
        {
          onSuccess: (res) => {
            const userResponse = res.user;

            if (
              userResponse.address !== userData?.address ||
              JSON.stringify(userResponse.coordinates) !==
                JSON.stringify(userData?.coordinates)
            ) {
              updateMeter({
                userId: userResponse.id,
                address: userResponse.address,
                coordinates: userResponse.coordinates,
                status: "ACTIVE",
              });
            }

            const statusChanged = originalStatus !== data.status;
            let message =
              "La información del usuario ha sido actualizada correctamente.";

            if (statusChanged) {
              if (data.status === "ACTIVE") {
                message += " El usuario ha sido activado.";
              } else if (data.status === "INACTIVE") {
                message += " El usuario ha sido desactivado.";
              }
            }

            toast({
              title: "Actualización exitosa",
              description: message,
              variant: "default",
            });

            setTimeout(() => {
              router.push("/dashboard/usuarios");
            }, 2000);
          },
        }
      );
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const watchedStatus = form.watch("status");
  const statusChanged = originalStatus !== watchedStatus;

  const isLoading = isLoadingUser || isUpdatingUser || isUpdatingMeter;
  return (
    <div className="mx-auto py-6 space-y-8">
      <Form {...form}>
        <form onKeyDown={handleKeyDown} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualice los datos personales del usuario
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          {isLoadingUser ? (
                            <Skeleton className="h-10 w-full" />
                          ) : (
                            <Input
                              placeholder="Nombre del usuario"
                              {...field}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          {isLoadingUser ? (
                            <Skeleton className="h-10 w-full" />
                          ) : (
                            <Input
                              placeholder="Apellido del usuario"
                              {...field}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        {isLoadingUser ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        {isLoadingUser ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Input
                            type="password"
                            placeholder="Dejar en blanco para mantener la actual"
                            {...field}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Estado y Acciones</CardTitle>
                <CardDescription>
                  Gestione el estado del usuario y guarde los cambios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado del Usuario</FormLabel>
                      <Select
                        disabled={isLoadingUser}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Activo</SelectItem>
                          <SelectItem value="INACTIVE">Inactivo</SelectItem>
                          <SelectItem value="PENDING">Pendiente</SelectItem>
                          <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        El estado determina si el usuario puede acceder al
                        sistema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {statusChanged && (
                  <Alert
                    variant={
                      watchedStatus === "ACTIVE" ? "default" : "destructive"
                    }
                    className="mt-4"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {watchedStatus === "ACTIVE"
                        ? "El usuario será activado"
                        : "El usuario será desactivado"}
                    </AlertTitle>
                    <AlertDescription>
                      {watchedStatus === "ACTIVE"
                        ? "Al guardar los cambios, el usuario podrá acceder al sistema."
                        : "Al guardar los cambios, el usuario no podrá acceder al sistema."}
                    </AlertDescription>
                  </Alert>
                )}

                {isLoading && (
                  <div className="text-sm text-muted-foreground">
                    Procesando la solicitud...
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Separator className="my-8" />

          {/* Location Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>
                Actualice la dirección y coordenadas del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* <div key={pathname}>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      {isLoadingUser ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <Autocomplete
                          onLoad={(autocomplete) => {
                            autocompleteRef.current = autocomplete;
                          }}
                          onPlaceChanged={handlePlaceChanged}
                          options={{
                            fields: ["formatted_address", "geometry.location"],
                          }}
                        >
                          <FormControl>
                            <Input
                              placeholder="Ingrese su dirección"
                              {...field}
                            />
                          </FormControl>
                        </Autocomplete>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div> */}

              <div className="rounded-md overflow-hidden">
                {isLoadingUser ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <UserLocationMap
                    initialLocation={mapCenter}
                    onLocationChange={handleLocationChange}
                    height="300px"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
