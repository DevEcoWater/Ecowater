"use client";

import React from "react";
import "@/app/globals.css";
import Image from "next/image";
import { clientConfig } from "@/config/client.config";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";

export interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps): React.JSX.Element {
  const { data: cooperative } = useCooperative();

  const logoUrl = (cooperative as any)?.logo_url as string | undefined;
  const name = cooperative?.name ?? clientConfig.brand.name;

  return (
    <>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-primary-foreground overflow-hidden">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src={clientConfig.brand.logo}
                    alt={clientConfig.brand.name}
                    width={20}
                    height={20}
                  />
                )}
              </div>
              {name}
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">{children}</div>
          </div>
        </div>
        <div className="relative hidden bg-muted lg:block">
          <div className="absolute inset-0 h-full w-full bg-black">
            {/* Blurred gradient spots — color sourced from --brand-accent CSS var */}
            <div className="absolute inset-0">
              <div className="absolute top-1 left-0 w-60 h-60 bg-gradient-to-r from-[var(--brand-accent)] to-emerald-500 rounded-full blur-[120px] opacity-40"></div>
              <div className="absolute bottom-1 right-0 w-60 h-60 bg-gradient-to-r from-[var(--brand-accent)] to-purple-500 rounded-full blur-[120px] opacity-40"></div>
            </div>
            <div className="flex flex-col items-center justify-center w-full h-full gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={name}
                  className="h-28 w-28 object-contain rounded-xl"
                />
              ) : (
                <Image
                  src={clientConfig.brand.logo}
                  alt={clientConfig.brand.name}
                  width={120}
                  height={120}
                />
              )}
              <h1 className="text-5xl font-bold text-white text-balance mb-2">
                {name}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
