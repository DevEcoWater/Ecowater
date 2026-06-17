"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";

interface RedirectHandlerProps {
  redirectTo?: string;
  fallbackTo?: string;
  loadingMessage?: string;
}

export function RedirectHandler({
  redirectTo = "/dashboard",
  fallbackTo = "/auth/login",
  loadingMessage = "Cargando...",
}: RedirectHandlerProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { data: cooperative } = useCooperative();

  const logoUrl = (cooperative as any)?.logo_url as string | undefined;
  const name = cooperative?.name ?? process.env.NEXT_PUBLIC_NAME ?? "EcoWater";

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session) {
      router.push(redirectTo);
    } else if (status === "unauthenticated") {
      router.push(fallbackTo);
    }
  }, [status, session, router, redirectTo, fallbackTo]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center overflow-hidden shadow-md">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="h-full w-full object-contain"
            />
          ) : (
            <Image src="/eco-water.svg" alt="Logo" width={40} height={40} />
          )}
        </div>
        <p className="text-lg font-semibold tracking-tight">{name}</p>
      </div>

      {/* Spinner */}
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 rounded-full border-2 border-muted border-t-primary animate-spin" />
        <p className="text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    </div>
  );
}
