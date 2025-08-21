"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUserMutation } from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import AddressAutocomplete from "@/components/ui/address-autocomplete";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

const formSchema = z
  .object({
    firstName: z.string().min(1, "Este campo es obligatorio"),
    lastName: z.string().min(1, "Este campo es obligatorio"),
    email: z.string().email("Ingrese un email válido"),
    address: z.string().min(1, "Debe seleccionar una ubicación válida"),
    shortData: z.string(),
    role_id: z.string(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function RegisterUserPage() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize form with zod resolver
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      shortData: "",
      password: "",
      role_id: "10e34911-a3b5-4d3f-891a-99cefc440ef8",
      confirmPassword: "",
      coordinates: defaultLocation,
    },
  });

  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const { mutate: createUser, isPending: isCreatingUser } = useUserMutation();

  const handlePlaceSelect = (place: {
    address: string;
    shortData: string;
    location: { lat: number; lng: number };
  }) => {
    form.setValue("address", place.address, { shouldValidate: true });
    form.setValue("coordinates", place.location, { shouldValidate: true });
    form.setValue("shortData", place.shortData);
    setMapCenter(place.location);
  };

  const onSubmit = (data: FormValues) => {
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      address: data.address,
      password: data.password,
      role_id: "10e34911-a3b5-4d3f-891a-99cefc440ef8",
    };

    createUser(
      {
        ...userData,
        address: {
          data: userData.address,
          shortData: data.shortData,
          lat: data.coordinates.lat.toString(),
          lng: data.coordinates.lng.toString(),
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Registro exitoso",
            description: "El usuario ha sido registrado correctamente.",
            variant: "default",
          });

          setTimeout(() => {
            router.push("/dashboard/usuarios");
          }, 2000);
        },
      }
    );

    form.reset();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const isLoading = isCreatingUser;

  return (
    <div className="mx-auto w-full h-full ">
      <Form {...form}>
        <form
          onKeyDown={handleKeyDown}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off">
          <div className="grid grid-cols-1 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Ingrese los datos personales del nuevo usuario
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
                          <Input
                            placeholder="Nombre del usuario"
                            {...field}
                            autoComplete="off"
                          />
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
                          <Input
                            placeholder="Apellido del usuario"
                            {...field}
                            autoComplete="off"
                          />
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
                          <Input
                            placeholder="correo@ejemplo.com"
                            {...field}
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol a asignar</FormLabel>
                        <FormControl>
                          <Input
                            disabled
                            value="Administrador"
                            placeholder="Administrador"
                            autoComplete="off"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Ingrese su contraseña"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Contraseña</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Reingrese su contraseña"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
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
                Seleccione la dirección del usuario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div key={pathname}>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="h-[300px] rounded-md overflow-hidden">
                <CoordinateMap
                  initialLocation={mapCenter}
                  readOnly={true}
                  height="300px"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-center gap-4">
                <Button
                  type="submit"
                  className="w-full sm:w-[200px]"
                  disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-[200px]"
                  onClick={() => router.back()}
                  disabled={isLoading}>
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
