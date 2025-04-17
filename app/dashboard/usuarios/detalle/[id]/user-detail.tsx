"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { X, Mail, User, Calendar, Home } from "lucide-react";

import { useUserQuery } from "@/hooks/users/use-user-query";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useMeterQuery } from "@/hooks/meters/user-meter-query";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);
  const { data: meterData, isLoading: isLoadingMeter } = useMeterQuery(userId);

  const [mapCenter, setMapCenter] = useState(defaultLocation);

  console.log(userData, "userData");

  useEffect(() => {
    if (userData?.address.address) {
      try {
        setMapCenter({
          lat: Number.parseFloat(userData.address.lat),
          lng: Number.parseFloat(userData.address.lng),
        });
      } catch (error) {
        console.error("Error parsing coordinates:", error);
      }
    }
  }, [userData]);

  console.log(meterData, "meterData");

  return (
    <div className="mx-auto py-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUser ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : userData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Nombre Completo
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {userData.firstName} {userData.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Correo Electrónico
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{userData.email}</span>
                    </div>
                  </div>

                  {userData.created_at && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Fecha de Registro
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(userData.created_at).toLocaleDateString(
                            "es-AR",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {userData.address && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Dirección
                      </div>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {userData.address.address}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {userData.address && (
                  <div className="h-[200px] w-full rounded-md overflow-hidden">
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
                      >
                        <Marker position={mapCenter} />
                      </GoogleMap>
                    </LoadScript>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <X className="h-8 w-8" />
                  <p>No se encontró información del usuario</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <CardTitle>Roles y Permisos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingUser ? (
              <Skeleton className="h-10 w-full" />
            ) : userData && userData.role ? (
              <div className="space-y-4">
                {/* Roles */}
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Roles asignados
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {userData.role ? (
                      <Badge className="w-fit" variant="outline">
                        {userData.role}
                      </Badge>
                    ) : (
                      <Badge className="w-fit" variant="outline">
                        Rol desconocido
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <div className="flex flex-col gap-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Estado de la cuenta
                  </div>
                  <Badge
                    className="w-fit"
                    variant={
                      userData.status === "ACTIVE" ? "default" : "destructive"
                    }
                  >
                    {userData.status === "ACTIVE" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>

                {/* Última actualización */}
                {userData.updated_at && (
                  <div className="flex flex-col gap-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Última actualización
                    </div>
                    <div className="font-medium">
                      {new Date(userData.updated_at).toLocaleDateString(
                        "es-AR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <X className="h-8 w-8" />
                  <p>No hay roles asignados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Meter Information Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          Detalle del Medidor
        </h2>

        {isLoadingMeter ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : meterData ? (
          <div className="grid grid-cols-1 gap-6">
            <Card key={meterData.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle>Medidor: {meterData.meter.device_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        ID del Medidor
                      </div>
                      <div className="font-medium">{meterData.meter.id}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        DEV EUI
                      </div>
                      <div className="font-medium">
                        {meterData.meter.dev_eui}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Fecha de Creación
                      </div>
                      <div className="font-medium">
                        {new Date(
                          meterData.meter.created_at
                        ).toLocaleDateString("es-AR")}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Estado
                      </div>
                      <Badge
                        className="w-fit"
                        variant={
                          meterData.meter.status === "ACTIVE"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {meterData.meter.status === "ACTIVE"
                          ? "Activo"
                          : "Inactivo"}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Estado Operacional
                      </div>
                      <Badge
                        className="w-fit"
                        variant={
                          meterData.meter.operational_status === "OPERATIONAL"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {meterData.meter.operational_status === "OPERATIONAL"
                          ? "Operativo"
                          : "No Operativo"}
                      </Badge>
                    </div>

                    {meterData.meter.application_name && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Aplicación
                        </div>
                        <div className="font-medium">
                          {meterData.meter.application_name}
                        </div>
                      </div>
                    )}
                  </div>

                  {meterData.meter.lat && meterData.meter.lng && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Ubicación del Medidor
                      </div>
                      <div className="h-[200px] w-full rounded-md overflow-hidden">
                        <LoadScript
                          googleMapsApiKey={
                            process.env
                              .NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string
                          }
                          libraries={["places"]}
                        >
                          <GoogleMap
                            mapContainerStyle={{
                              width: "100%",
                              height: "100%",
                            }}
                            center={{
                              lat: meterData.meter.lat,
                              lng: meterData.meter.lng,
                            }}
                            zoom={14}
                          >
                            <Marker
                              position={{
                                lat: meterData.meter.lat,
                                lng: meterData.meter.lng,
                              }}
                            />
                          </GoogleMap>
                        </LoadScript>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <X className="h-12 w-12" />
                <p className="text-lg font-medium">No hay medidor asociado</p>
                <p className="text-center text-sm">
                  Este usuario no tiene medidor asignado
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
