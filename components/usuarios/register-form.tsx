"use client";

import type React from "react";
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CoordinateMap from "@/components/ui/coordinateMap";
import AddressAutocomplete from "@/components/ui/address-autocomplete";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

const formSchema = z
  .object({
    firstName: z.string().min(1, "Este campo es obligatorio"),
    lastName: z.string().min(1, "Este campo es obligatorio"),
    email: z.string().email("Ingrese un email válido"),
    address: z.string().min(1, "Debe seleccionar una ubicación válida"),
    shortData: z.string(),
    role: z.enum(["admin", "lector"], {
      required_error: "Seleccioná un rol",
    }),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      shortData: "",
      // No default for role — forces a conscious choice
      password: "",
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
    createUser(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: data.role,
        address: {
          data: data.address,
          shortData: data.shortData,
          lat: data.coordinates.lat.toString(),
          lng: data.coordinates.lng.toString(),
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Usuario creado",
            description: "El usuario ha sido registrado correctamente.",
          });
          form.reset();
          setTimeout(() => {
            router.push("/dashboard/usuarios");
          }, 1500);
        },
        onError: (err) => {
          toast({
            title: "Error al crear el usuario",
            description: err.message || "No se pudo registrar el usuario. Intentá de nuevo.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const isLoading = isCreatingUser;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form
          onKeyDown={handleKeyDown}
          onSubmit={form.handleSubmit(onSubmit)}
          autoComplete="off"
          className="space-y-6"
        >
          {/* Personal Information Card */}
          <Card>
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccioná un rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent avoidCollisions={false}>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="lector">Lector</SelectItem>
                        </SelectContent>
                      </Select>
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
                          onChange={(value) => field.onChange(value)}
                          onPlaceSelect={(place) => handlePlaceSelect(place)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="h-[300px] rounded-md overflow-hidden border">
                <CoordinateMap
                  initialLocation={mapCenter}
                  readOnly={true}
                  height="300px"
                />
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
              {isCreatingUser ? "Creando..." : "Crear usuario"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
