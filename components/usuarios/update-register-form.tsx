"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useUserQuery,
  useUpdateUserMutation,
} from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Save, ArrowLeft } from "lucide-react";
import { useWatch } from "react-hook-form";

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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserStatus } from "@prisma/client";
import AddressAutocomplete from "@/components/ui/address-autocomplete";
import CoordinateMap from "@/components/ui/coordinateMap";
import { UpdateUserFormValues } from "@/types/users/user-types";
import { useSession } from "next-auth/react";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

const formSchema = z.object({
  firstName: z.string().min(1, "Este campo es obligatorio"),
  lastName: z.string().min(1, "Este campo es obligatorio"),
  email: z.string().email("Ingrese un email válido"),
  address: z.string().min(1, "Debe seleccionar una ubicación válida"),
  shortData: z.string(),
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
  const session = useSession();
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
      shortData: "",
      status: UserStatus.ACTIVE,
      coordinates: defaultLocation,
    },
  });

  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUserMutation();

  const isAdmin = session.data?.user?.role === "admin";
  const isLoading = isLoadingUser || isUpdatingUser;

  const initials = userData
    ? `${userData.firstName?.[0] ?? ""}${userData.lastName?.[0] ?? ""}`.toUpperCase()
    : "";

  useEffect(() => {
    if (userData && !isLoadingUser) {
      form.reset({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        address: userData.address.data || "",
        shortData: userData.address.shortData || "",
        status: userData.status ?? UserStatus.ACTIVE,
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
  }, [userData, isLoadingUser, form]);

  const handlePlaceSelect = (place: {
    address: string;
    shortData: string;
    location: { lat: number; lng: number };
  }) => {
    form.setValue("address", place.address, { shouldValidate: true });
    form.setValue("shortData", place.shortData);
    form.setValue("coordinates", place.location, { shouldValidate: true });
    setMapCenter(place.location);
  };

  const onSubmit = ({
    firstName,
    lastName,
    email,
    address,
    shortData,
    status,
    coordinates,
  }: FormValues) => {
    const formattedData: UpdateUserFormValues = {
      id: userId,
      firstName,
      lastName,
      email,
      status,
      address: {
        data: address,
        shortData,
        lat: coordinates?.lat?.toString() || "",
        lng: coordinates?.lng?.toString() || "",
      },
    };

    updateUser(formattedData, {
      onSuccess: () => {
        const statusChanged = originalStatus !== status;
        toast({
          title: "Cambios guardados",
          description: statusChanged
            ? `Estado actualizado a ${status}.`
            : "Los datos del usuario fueron actualizados.",
        });
        setTimeout(() => {
          router.push(`/dashboard/usuarios/${userId}`);
        }, 1500);
      },
      onError: (err) => {
        toast({
          title: "Error al guardar",
          description: err.message || "No se pudieron guardar los cambios. Intentá de nuevo.",
          variant: "destructive",
        });
      },
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      {/* Context header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {isLoadingUser ? (
            <>
              <Skeleton className="w-10 h-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Editando usuario</p>
                <p className="font-semibold leading-tight">
                  {userData?.firstName} {userData?.lastName}
                </p>
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      <Form {...form}>
        <form
          onKeyDown={handleKeyDown}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* Personal Information Card */}
          <Card id="tour-edit-personal">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualizá los datos personales del usuario
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
                          <Input placeholder="Nombre del usuario" {...field} />
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
                          <Input placeholder="Apellido del usuario" {...field} />
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
                          <Input placeholder="correo@ejemplo.com" {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado del Usuario</FormLabel>
                        <Select
                          disabled={isLoadingUser}
                          onValueChange={field.onChange}
                          value={field.value ?? UserStatus.ACTIVE}
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card id="tour-edit-location">
            <CardHeader>
              <CardTitle>Ubicación</CardTitle>
              <CardDescription>
                Actualizá la dirección del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                          onChange={(value) => field.onChange(value)}
                          onPlaceSelect={(place) => handlePlaceSelect(place)}
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
            </CardContent>
          </Card>

          {/* Sticky action footer */}
          <div className="sticky bottom-0 z-10 bg-background border-t py-3 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isUpdatingUser ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
