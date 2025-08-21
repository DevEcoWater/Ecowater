"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { X, Mail, User, Calendar, Home } from "lucide-react";

import { useUserQuery } from "@/hooks/users/use-user-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { formatUserType } from "@/utils/formatUserType";
import { Button } from "@/components/ui/button";
import Chip from "@/components/ui/chip";
import { chipConfig } from "@/utils/getChipColor";
import CoordinateMap from "@/components/ui/coordinateMap";

const defaultLocation = { lat: -34.603722, lng: -58.381592 };

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);
  console.log(userData, "userData");

  const [mapCenter, setMapCenter] = useState(defaultLocation);

  useEffect(() => {
    if (userData?.address.data) {
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

  return (
    <div className="mx-auto w-full h-full">
      <div className="grid grid-cols-1 gap-6">
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
                        <span className="font-medium text-sm">
                          {userData.address.data.split(",")[0]}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {userData.address && (
                  <div className="h-[200px] w-full rounded-md overflow-hidden">
                    <CoordinateMap
                      initialLocation={mapCenter}
                      readOnly={true}
                      height="200px"
                    />
                  </div>
                )}

                <div className="space-y-6">
                  <CardTitle>Roles y Permisos</CardTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Roles asignados
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {userData.role ? (
                          <Badge
                            className="flex gap-2 justify-center items-center rounded-xl py-1 px-2.5 text-sm w-[100px]"
                            variant="outline">
                            {formatUserType(userData.role)}
                          </Badge>
                        ) : (
                          <Badge
                            className="flex gap-2 justify-center items-center rounded-xl py-1 px-2.5 text-sm w-[100px]"
                            variant="outline">
                            Rol desconocido
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Estado */}
                    <div className="flex flex-col gap-2 space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Estado de la cuenta
                      </div>
                      <Chip
                        status={userData?.status}
                        style={{ marginTop: 0 }}
                      />
                    </div>
                    {/* Última actualización */}
                    {userData.updated_at && (
                      <div className="flex flex-col gap-2 space-y-2">
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
                    {!userData.meter && (
                      <div className="flex flex-col gap-2 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">
                          Información del Medidor
                        </div>
                        <div className="font-medium">
                          No hay medidor asociado
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {userData.meter && (
                  <div className="w-full flex flex-col justify-center gap-6 ">
                    <div className="flex flex-col gap-4">
                      <CardTitle>Información del Medidor</CardTitle>
                      <div className="space-y-6">
                        <div className="flex flex-col gap-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            ID del Medidor
                          </div>
                          <div className="font-medium">
                            {userData.meter.dev_eui
                              ? userData.meter.dev_eui
                              : "Sin medidor"}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            Estado del medidor
                          </div>
                          <Chip status={userData.meter.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:max-w-[300px] lg:mx-auto lg:w-[300px]">
                      <Button>Ver Medidor</Button>
                    </div>
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
      </div>
    </div>
  );
}
