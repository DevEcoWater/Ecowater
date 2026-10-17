import { useSession } from "next-auth/react";
import { canEditDashboard } from "@/lib/auth/roles";

/** false para roles de solo lectura (p. ej. lector) y mientras carga la sesión. */
export function useCanEdit(): boolean {
  const { data: session } = useSession();
  return canEditDashboard(session?.user?.role);
}
