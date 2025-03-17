"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider, useSession } from "next-auth/react";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (status === "unauthenticated") {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión de nuevo.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

interface SessionClientProps {
  children: React.ReactNode;
}

const SessionClient: React.FC<SessionClientProps> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ProtectedRoute>{children}</ProtectedRoute>
      </SessionProvider>
    </QueryClientProvider>
  );
};

export { SessionClient, ProtectedRoute };
