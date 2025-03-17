"use client";

import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  GoogleMap,
  LoadScript,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useUserMutation } from "@/hooks/useUsers";
import { useMeterMutation } from "@/hooks/useMeter";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

const RegisterUserForm: React.FC = () => {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      address: "",
      password: "",
      coordinates: defaultLocation,
    },
  });

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const { mutate: createUser, isPending: isCreatingUser } = useUserMutation();
  const { mutate: createMeter, isPending: isCreatingMeter } =
    useMeterMutation();

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };

      setMapCenter(location);
      setValue("coordinates", location);

      setValue("address", place.formatted_address || "", {
        shouldValidate: true,
      });
    }
  };

  function getRandomStatus(): "active" | "inactive" | "error" {
    const statuses = ["active", "inactive", "error"];
    const randomIndex = Math.floor(Math.random() * statuses.length);
    return statuses[randomIndex] as "active" | "inactive" | "error";
  }
  const onSubmit = (data: any) => {
    createUser(data, {
      onSuccess: (userResponse) => {
        createMeter({
          userId: userResponse.user._id,
          status: getRandomStatus(),
          address: userResponse.user.address,
          coordinates: userResponse.user.coordinates,
        });

        toast({
          title: "Registro exitoso",
          description: "El usuario ha sido registrado correctamente.",
          variant: "default",
        });

        setTimeout(() => {
          router.push("/dashboard/usuarios");
        }, 5000);
      },
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  return (
    <form
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Registración de Cliente</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Por favor ingrese la información del cliente para registrar.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Controller
            control={control}
            name="username"
            rules={{ required: "Este campo es obligatorio" }}
            render={({ field }) => (
              <Input {...field} id="username" placeholder="Nombre de usuario" />
            )}
          />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Este campo es obligatorio",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Ingrese un email válido",
              },
            }}
            render={({ field }) => (
              <Input {...field} id="email" placeholder="m@example.com" />
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Controller
            control={control}
            name="password"
            rules={{
              required: "Este campo es obligatorio",
              minLength: {
                value: 6,
                message: "La contraseña debe tener al menos 6 caracteres",
              },
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
              />
            )}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>

        <div key={pathname} className="grid gap-2">
          <LoadScript
            googleMapsApiKey={
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string
            }
            libraries={["places"]}
          >
            <Label htmlFor="address">Dirección</Label>
            <Autocomplete
              onLoad={(autocomplete) =>
                (autocompleteRef.current = autocomplete)
              }
              onPlaceChanged={handlePlaceChanged}
            >
              <Input
                id="address"
                placeholder="Ingrese su dirección"
                {...{
                  ...control.register("address", {
                    required: "Debe seleccionar una ubicación válida",
                  }),
                }}
              />
            </Autocomplete>
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address.message}</p>
            )}
          </LoadScript>
        </div>

        <div className="h-60">
          <LoadScript
            googleMapsApiKey={
              process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string
            }
            libraries={["places"]}
          >
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={mapCenter}
              zoom={14}
              onClick={(e) => {
                const coords = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
                setValue("coordinates", coords);
                setMapCenter(coords);
              }}
            >
              <Marker position={mapCenter} />
            </GoogleMap>
          </LoadScript>
        </div>

        <Button
          type="submit"
          className="w-[200px] mx-auto"
          disabled={isCreatingUser || isCreatingMeter}
        >
          {isCreatingUser || isCreatingMeter ? "Cargando..." : "Registrar"}
        </Button>
      </div>
    </form>
  );
};

export default RegisterUserForm;
