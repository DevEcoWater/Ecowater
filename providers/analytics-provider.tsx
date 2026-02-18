"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setUser, setUserProps } from "@/lib/firebase/analytics";

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que configura Firebase Analytics con información del usuario
 * cuando está autenticado
 */
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Solo configurar usuario cuando la sesión esté cargada
    if (status === "loading") return;

    if (session?.user) {
      // Establecer ID del usuario
      setUser(session.user.id);

      // Establecer propiedades del usuario
      setUserProps({
        user_id: session.user.id,
        user_role: session.user.role || "unknown",
        user_email: session.user.email || "",
      });
    } else {
      // Limpiar usuario cuando no hay sesión
      setUser(null);
    }
  }, [session, status]);

  return <>{children}</>;
}

