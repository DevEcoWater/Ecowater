"use client";

import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case "Configuration":
        return "Ha ocurrido un error en la configuración del servidor.";
      case "AccessDenied":
        return "Acceso denegado. No tiene permisos para acceder a esta página.";
      case "Verification":
        return "El código de verificación no es válido o ha expirado.";
      default:
        return "Ha ocurrido un error de autenticación.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error de autenticación</CardTitle>
          <CardDescription>{getErrorMessage(error)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Pruebe otra vez</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
