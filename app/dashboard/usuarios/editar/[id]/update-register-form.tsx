"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useUserQuery,
  useUpdateUserMutation,
} from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
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
import { UserStatus } from "@prisma/client";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import CoordinateMap from "@/components/ui/coordinateMap";
import { UpdateUserFormValues } from "@/types/users/user-types";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

// Define form schema with Zod
const formSchema = z.object({
  firstName: z.string().min(1, "Este campo es obligatorio"),
  lastName: z.string().min(1, "Este campo es obligatorio"),
  email: z.string().email("Ingrese un email válido"),
  address: z.string().min(1, "Debe seleccionar una ubicación válida"),
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
  const params = useParams();
  const userId = params.id as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      status: UserStatus.ACTIVE,
      coordinates: defaultLocation,
    },
  });

  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);

  const { mutate: updateUser, isPending: isUpdatingUser } =
    useUpdateUserMutation();

  useEffect(() => {
    if (userData && !isLoadingUser) {
      form.reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        address: userData.address.data || "",
        status: userData.status ?? UserStatus.ACTIVE, // defensive fallback
        coordinates: {
          lat: Number(userData.address.lat),
          lng: Number(userData.address.lng),
        },
      });

      setOriginalStatus(userData.status);

      setMapCenter({
        lat: Number(userData.address.lat),
        lng: Number(userData.address.lng),
      });
    }
    console.log(userData, "userData");
  }, [userData, isLoadingUser, form]);

  console.log(form.getValues(), "form values");

  const handlePlaceSelect = (place: {
    address: string;
    location: { lat: number; lng: number };
  }) => {
    form.setValue("address", place.address, { shouldValidate: true });

    form.setValue("coordinates", place.location, { shouldValidate: true });

    setMapCenter(place.location);
  };

  const onSubmit = ({
    firstName,
    lastName,
    email,
    address,
    status,
    coordinates,
  }: FormValues) => {
    const formattedData: UpdateUserFormValues = {
      id: userId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      status: status,
      address: {
        data: address,
        lat: coordinates?.lat?.toString() || "",
        lng: coordinates?.lng?.toString() || "",
      },
    };

    updateUser(formattedData, {
      onSuccess: () => {
        const statusChanged = originalStatus !== status;
        let message;

        if (statusChanged) {
          message = `El estado del usuario ha sido actualizado a ${status}`;
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
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const isLoading = isLoadingUser || isUpdatingUser;
  // const watchedStatus = form.watch("status");

  return (
    <div className="mx-auto py-6 space-y-8">
      <Form {...form}>
        <form onKeyDown={handleKeyDown} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 gap-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <Input
                              placeholder="correo@ejemplo.com"
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado del Usuario</FormLabel>
                        <Select
                          disabled={isLoadingUser}
                          onValueChange={field.onChange}
                          value={field.value ?? UserStatus.ACTIVE} // Fallback to valid enum
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent avoidCollisions={false}>
                            <SelectItem value="ACTIVE">Activo</SelectItem>
                            <SelectItem value="INACTIVE">Inactivo</SelectItem>
                            <SelectItem value="PENDING">Pendiente</SelectItem>
                            <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                          </SelectContent>
                        </Select>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
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
              {/* Añadimos el componente de autocompleted de direcciones */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      {isLoadingUser ? (
                        <Skeleton className="h-10 w-full" />
                      ) : (
                        <AddressAutocomplete
                          placeholder="Ingrese la dirección del usuario"
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                          }}
                          onPlaceSelect={(place) => {
                            handlePlaceSelect(place);
                          }}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md overflow-hidden border">
                {isLoadingUser ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <CoordinateMap
                    initialLocation={mapCenter}
                    readOnly={true}
                    height="300px"
                  />
                )}
              </div>
              {/* {watchedStatus && (
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
              )} */}

              {isLoading && (
                <div className="text-sm text-muted-foreground">
                  Procesando la solicitud...
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
                <Button
                  type="submit"
                  className="w-full sm:w-[200px]"
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-[200px]"
                  onClick={() => router.back()}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
