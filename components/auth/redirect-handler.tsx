"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RedirectHandlerProps {
  redirectTo?: string;
  fallbackTo?: string;
  loadingMessage?: string;
}

export function RedirectHandler({
  redirectTo = "/dashboard",
  fallbackTo = "/auth/signin",
  loadingMessage = "Cargando...",
}: RedirectHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("RedirectHandler - status:", status, "session:", !!session);

    if (status === "loading") return;

    if (status === "authenticated" && session) {
      console.log("Autenticado, redirigiendo a", redirectTo);
      router.push(redirectTo);
    } else if (status === "unauthenticated") {
      console.log("No autenticado, redirigiendo a", fallbackTo);
      router.push(fallbackTo);
    }
  }, [status, session, router, redirectTo, fallbackTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redirigiendo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-sm text-muted-foreground">
              {loadingMessage}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
