"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoutesWIthSession: React.FC<ProtectedRouteProps> = ({
  children,
}) => {
  const router = useRouter();
  const { status } = useSession();
  const { toast } = useToast();

  console.log(status, "status");

  useEffect(() => {
    if (status === "unauthenticated") {
      toast({
        title: "Sesión expirada",
        description: "Por favor inicia sesión de nuevo.",
        variant: "destructive",
      });
      router.push("/auth/login");
    }

    if (status === "authenticated") {
      router.push("/dashboard");
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

export { ProtectedRoutesWIthSession };
