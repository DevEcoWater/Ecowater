"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useUserMutation } from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UserPlus } from "lucide-react";

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
      password: "",
      confirmPassword: "",
      coordinates: defaultLocation,
    },
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const { mutate: createUser, isPending: isCreatingUser } = useUserMutation();

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

  function getRandomStatus(): "ACTIVE" | "INACTIVE" {
    const statuses = ["ACTIVE", "INACTIVE", "error"];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex] as "ACTIVE" | "INACTIVE";
  }

  const handlePlaceSelect = (place: {
    address: string;
    location: { lat: number; lng: number };
  }) => {
    form.setValue("address", place.address, { shouldValidate: true });
    form.setValue("coordinates", place.location, { shouldValidate: true });
    setMapCenter(place.location);
  };

  const onSubmit = (data: FormValues) => {
    // Convert form data to match API expectations
    const userData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      address: data.address,
      password: data.password,
      role_id: "5b42ecad-2634-4546-ae9e-ae8425469f48",
    };

    createUser(
      {
        ...userData,
        address: {
          data: userData.address,
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
    <div className="mx-auto py-6 space-y-8">
      <Form {...form}>
        <form onKeyDown={handleKeyDown} onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information Card */}
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
                          <Input placeholder="Nombre del usuario" {...field} />
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
                          />
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
                        <Input placeholder="correo@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </CardContent>
          </Card>

          <Separator className="my-8" />

          <Card>
            <CardHeader className="flex flex-col lg:flex-row justify-center ">
              <Button
                type="submit"
                className="w-full lg:w-[200px]"
                disabled={isLoading}>
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Registrando..." : "Registrar Usuario"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full lg:w-[200px] mt-0"
                onClick={() => router.back()}
                disabled={isLoading}>
                Cancelar
              </Button>
            </CardHeader>
          </Card>
        </form>
      </Form>
    </div>
  );
}
