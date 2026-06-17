"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  Mail,
  Home,
  Activity,
  Shield,
  Plus,
  RefreshCw,
  Pen,
  ArrowLeft,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { useSession } from "next-auth/react";

import {
  useUserQuery,
  useDeleteUserMutation,
  useReactivateUserMutation,
} from "@/hooks/users/use-user-query";
import { useToggleCanWriteMutation } from "@/hooks/users/use-can-write";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatUserType } from "@/utils/formatUserType";
import { formatDateAR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Chip from "@/components/ui/chip";
import CoordinateMap from "@/components/ui/coordinateMap";
import { UserInfoSkeleton } from "./user-skeleton";
import { AssignMeterModal } from "@/components/modals/assign-meter-modal";
import { useToast } from "@/hooks/use-toast";

const defaultLocation = { lat: -34.9035949, lng: -58.0373327 };

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: session } = useSession();
  const { data: userData, isLoading: isLoadingUser } = useUserQuery(userId);
  const toggleCanWrite = useToggleCanWriteMutation(userId);
  const deleteUser = useDeleteUserMutation();
  const reactivateUser = useReactivateUserMutation();
  const { toast } = useToast();

  const [mapCenter, setMapCenter] = useState(defaultLocation);
  const [hasValidCoords, setHasValidCoords] = useState(false);
  const [isAssignMeterOpen, setIsAssignMeterOpen] = useState(false);
  const [canWriteDialogOpen, setCanWriteDialogOpen] = useState(false);
  const [pendingCanWrite, setPendingCanWrite] = useState<boolean | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const isViewingOwnProfile = session?.user?.id === userId;
  const canManagePermissions =
    session?.user?.role === "ADMIN" && !isViewingOwnProfile && userData?.role === "ADMIN";
  const canManageStatus = session?.user?.role === "ADMIN" && !isViewingOwnProfile;

  const initials = `${userData?.firstName?.[0] ?? ""}${userData?.lastName?.[0] ?? ""}`.toUpperCase();

  useEffect(() => {
    if (userData?.address?.data) {
      try {
        const lat = Number.parseFloat(userData.address.lat);
        const lng = Number.parseFloat(userData.address.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
          setMapCenter({ lat, lng });
          setHasValidCoords(true);
        }
      } catch {
        // coords unavailable — map stays hidden
      }
    }
  }, [userData]);

  function handleCanWriteClick(newValue: boolean) {
    setPendingCanWrite(newValue);
    setCanWriteDialogOpen(true);
  }

  function handleCanWriteConfirm() {
    if (pendingCanWrite === null) return;
    toggleCanWrite.mutate(pendingCanWrite, {
      onSuccess: () => {
        toast({
          title: pendingCanWrite
            ? "Permiso de escritura habilitado"
            : "Permiso de escritura revocado",
          description: `${userData?.firstName} ${userData?.lastName} ${
            pendingCanWrite ? "ahora puede" : "ya no puede"
          } ejecutar comandos de válvula.`,
        });
        setCanWriteDialogOpen(false);
        setPendingCanWrite(null);
      },
      onError: (err) => {
        toast({
          title: "Error al actualizar permiso",
          description: err.message,
          variant: "destructive",
        });
        setCanWriteDialogOpen(false);
        setPendingCanWrite(null);
      },
    });
  }

  function handleStatusConfirm() {
    if (!userData) return;
    const isActive = userData.status === "ACTIVE";
    const action = isActive ? deleteUser : reactivateUser;
    action.mutate(userId, {
      onSuccess: () => {
        toast({
          title: isActive ? "Usuario desactivado" : "Usuario activado",
          description: `${userData.firstName} ${userData.lastName} fue ${
            isActive ? "desactivado" : "activado"
          } correctamente.`,
        });
        setStatusDialogOpen(false);
      },
      onError: (err) => {
        toast({
          title: "Error al actualizar el estado",
          description: err.message,
          variant: "destructive",
        });
        setStatusDialogOpen(false);
      },
    });
  }

  const handleRedirect = (url: string) => {
    if (url) {
      router.push(`/dashboard/medidores/${url}`);
    }
  };

  if (isLoadingUser) return <UserInfoSkeleton />;

  if (!userData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <X className="h-8 w-8" />
          <p>No se encontró información del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AssignMeterModal */}
      <AssignMeterModal
        userId={userId}
        userName={`${userData.firstName} ${userData.lastName}`}
        currentMeterId={userData.meter?.id}
        isOpen={isAssignMeterOpen}
        onClose={() => setIsAssignMeterOpen(false)}
      />

      {/* Profile header card */}
      <Card id="tour-user-info">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Avatar + identity */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-semibold">
                    {userData.firstName} {userData.lastName}
                  </h2>
                  {userData.role && (
                    <Badge variant="outline">{formatUserType(userData.role)}</Badge>
                  )}
                  <Chip status={userData.status} style={{ marginTop: 0 }} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3.5 w-3.5" />
                  {userData.email}
                </div>
                {userData.created_at && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Miembro desde {formatDateAR(userData.created_at)}
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/usuarios/${userId}/editar`}>
                  <Pen className="h-4 w-4 mr-1" />
                  Editar
                </Link>
              </Button>
              {canManageStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  className={
                    userData.status === "ACTIVE"
                      ? "border-red-300 text-red-700 hover:bg-red-50"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }
                  onClick={() => setStatusDialogOpen(true)}
                >
                  {userData.status === "ACTIVE" ? "Desactivar" : "Activar"}
                </Button>
              )}
            </div>
          </div>

          {/* Personal data (clean list, no input boxes) */}
          {(userData.address || userData.updated_at) && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userData.address && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" />
                      Dirección
                    </p>
                    <p className="text-sm font-medium">{userData.address.data}</p>
                  </div>
                )}
                {userData.updated_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Última actualización
                    </p>
                    <p className="text-sm font-medium">{formatDateAR(userData.updated_at)}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Map — only when coords are valid */}
          {hasValidCoords && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  Ubicación
                </p>
                <div className="h-[200px] w-full rounded-md overflow-hidden">
                  <CoordinateMap
                    initialLocation={mapCenter}
                    readOnly={true}
                    height="200px"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Roles y Permisos card */}
      <Card id="tour-user-roles">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Roles y Permisos</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Rol asignado</p>
            {userData.role ? (
              <Badge
                className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-3 py-1 text-sm font-medium"
                variant="outline"
              >
                {formatUserType(userData.role)}
              </Badge>
            ) : (
              <Badge
                className="bg-muted text-muted-foreground border-border px-3 py-1 text-sm"
                variant="outline"
              >
                Rol desconocido
              </Badge>
            )}
          </div>

          {canManagePermissions && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Pen className="h-3.5 w-3.5" />
                Permiso de escritura — control de válvulas vía MQTT
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={
                    userData.can_write
                      ? "bg-green-100 text-green-800 border-green-200 text-xs"
                      : "bg-gray-100 text-gray-600 border-gray-200 text-xs"
                  }
                >
                  {userData.can_write ? "Habilitado" : "Deshabilitado"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className={`text-xs ${
                    userData.can_write
                      ? "border-red-300 text-red-700 hover:bg-red-50"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                  disabled={toggleCanWrite.isPending}
                  onClick={() => handleCanWriteClick(!userData.can_write)}
                >
                  {userData.can_write ? "Revocar" : "Habilitar"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medidor card */}
      {userData.meter ? (
        <Card id="tour-user-meter">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg font-semibold">Información del Medidor</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignMeterOpen(true)}
                className="gap-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Cambiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">ID del medidor</p>
              <p className="font-mono text-sm">{userData.meter.dev_eui || "Sin medidor"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Estado del medidor</p>
              <Chip status={userData.meter.status} style={{ marginTop: 0 }} />
            </div>
            <div className="pt-4 border-t flex justify-end">
              <Button
                onClick={() => handleRedirect(userData.meter.id)}
              >
                Ver Medidor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card
          id="tour-user-meter"
          className="border-2 border-dashed border-muted-foreground/20"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-muted-foreground">
                Información del Medidor
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="font-medium text-muted-foreground">No hay medidor asociado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Este usuario no tiene un medidor configurado
            </p>
            <Button
              variant="outline"
              className="mt-6 gap-2"
              onClick={() => setIsAssignMeterOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Asignar medidor
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Can-write permission dialog */}
      <AlertDialog
        open={canWriteDialogOpen}
        onOpenChange={(open) => !open && setCanWriteDialogOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCanWrite ? "Habilitar permiso de escritura" : "Revocar permiso de escritura"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  {pendingCanWrite
                    ? `Al habilitar este permiso, ${userData.firstName} ${userData.lastName} podrá:`
                    : `Al revocar este permiso, ${userData.firstName} ${userData.lastName} ya no podrá:`}
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Abrir y cerrar válvulas de medidores inteligentes vía MQTT</li>
                  <li>Ejecutar comandos que afectan la infraestructura física</li>
                </ul>
                <p className="text-xs">Esta acción queda registrada en el sistema de auditoría.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggleCanWrite.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCanWriteConfirm}
              disabled={toggleCanWrite.isPending}
              className={
                pendingCanWrite
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate / Deactivate user dialog */}
      <AlertDialog
        open={statusDialogOpen}
        onOpenChange={(open) => !open && setStatusDialogOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userData.status === "ACTIVE" ? "Desactivar usuario" : "Activar usuario"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                {userData.status === "ACTIVE" ? (
                  <p>
                    {`${userData.firstName} ${userData.lastName} perderá acceso al sistema. Podés reactivar la cuenta en cualquier momento.`}
                  </p>
                ) : (
                  <p>
                    {`${userData.firstName} ${userData.lastName} recuperará el acceso al sistema con sus permisos anteriores.`}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteUser.isPending || reactivateUser.isPending}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusConfirm}
              disabled={deleteUser.isPending || reactivateUser.isPending}
              className={
                userData.status === "ACTIVE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
