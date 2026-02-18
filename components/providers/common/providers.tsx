"use client";
import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsProvider } from "@/providers/analytics-provider";

type Props = {
  children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </SessionProvider>
      </QueryClientProvider>
      <Toaster />
    </>
  );
};

export default Providers;
