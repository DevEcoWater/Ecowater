import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Mail, Calendar, Home, Shield, Activity } from "lucide-react";

export function UserInfoSkeleton() {
  return (
    <div className="mx-auto w-full h-full">
      <div className="grid grid-cols-1 gap-6">
        {/* User Information Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información del Usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Basic User Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Nombre Completo
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Correo Electrónico
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                </div>

                {/* Registration Date Field */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Fecha de Registro
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>

                {/* Address Field */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Dirección
                  </div>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <Skeleton className="h-5 w-56" />
                  </div>
                </div>
              </div>

              {/* Map Skeleton */}
              <div className="h-[200px] w-full rounded-md overflow-hidden bg-muted border">
                <Skeleton className="h-full w-full" />
              </div>

              {/* Roles and Meter Info Grid */}
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
                    {/* Roles Section */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Roles asignados
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-7 w-24 rounded-full" />
                      </div>
                    </div>

                    {/* Account Status Section */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Estado de la cuenta
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    {/* Last Update Section */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        Última actualización
                      </div>
                      <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md border">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Información del Medidor Card */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg font-semibold">
                        Información del Medidor
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Meter ID Section */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        ID del Medidor
                      </div>
                      <div className="bg-muted px-3 py-2 rounded-md border">
                        <Skeleton className="h-5 w-40" />
                      </div>
                    </div>

                    {/* Meter Status Section */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground">
                        Estado del medidor
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    {/* View Meter Button */}
                    <div className="pt-4 border-t">
                      <Skeleton className="h-10 w-full rounded-md" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
