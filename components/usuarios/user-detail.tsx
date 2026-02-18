"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { X, Mail, User, Calendar, Home, Activity, Shield } from "lucide-react";

import { useUserQuery } from "@/hooks/users/use-user-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { formatUserType } from "@/utils/formatUserType";
import { Button } from "@/components/ui/button";
import Chip from "@/components/ui/chip";
import { chipConfig } from "@/utils/getChipColor";
import CoordinateMap from "@/components/ui/coordinateMap";
import { UserInfoSkeleton } from "./user-skeleton";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);

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

  const handleRedirect = (url: string) => {
    if (url) {
      router.push(`/dashboard/medidores/${url}`);
    }
  };

  if (isLoadingUser) return <UserInfoSkeleton />;

  return (
    <div className="mx-auto w-full h-full">
      <div className="grid grid-cols-1 gap-6">
        {/* User Information Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {userData ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">
                      Nombre Completo
                    </div>
                    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
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
                    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{userData.email}</span>
                    </div>
                  </div>

                  {userData.created_at && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Fecha de Registro
                      </div>
                      <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
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
                      <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Roles y Permisos Card */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg font-semibold">
                          Roles y Permisos
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Roles asignados
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {userData.role ? (
                            <Badge
                              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-3 py-1 text-sm font-medium"
                              variant="outline">
                              {formatUserType(userData.role)}
                            </Badge>
                          ) : (
                            <Badge
                              className="bg-muted text-muted-foreground border-border px-3 py-1 text-sm"
                              variant="outline">
                              Rol desconocido
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground">
                          Estado de la cuenta
                        </div>
                        <Chip
                          status={userData?.status}
                          style={{ marginTop: 0 }}
                        />
                      </div>

                      {userData.updated_at && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">
                            Última actualización
                          </div>
                          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(userData.updated_at).toLocaleDateString(
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
                    </CardContent>
                  </Card>

                  {/* Información del Medidor Card */}
                  {userData.meter ? (
                    <Card className="border shadow-sm ">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg font-semibold">
                            Información del Medidor
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            ID del Medidor
                          </div>
                          <div className="font-mono text-sm bg-muted px-3 py-2 rounded-md border">
                            {userData.meter.dev_eui || "Sin medidor"}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="text-sm font-medium text-muted-foreground">
                            Estado del medidor
                          </div>
                          <Chip status={userData.meter.status} />
                        </div>

                        <div className="pt-4 border-t">
                          <Button
                            onClick={() =>
                              handleRedirect(userData && userData.meter.id)
                            }
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                            Ver Medidor
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-2 border-dashed border-muted-foreground/20 shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg font-semibold text-muted-foreground">
                            Información del Medidor
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="text-muted-foreground">
                          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p className="font-medium">No hay medidor asociado</p>
                          <p className="text-sm mt-1">
                            Este usuario no tiene un medidor configurado
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
