"use client";

import React from "react";
import "../../app/globals.css";
import Image from "next/image";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "../ui/toaster";
export interface LayoutProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

export function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <div className="grid min-h-svh lg:grid-cols-2">
          <div className="flex flex-col gap-4 p-6 md:p-10">
            <div className="flex justify-center gap-2 md:justify-start">
              <a href="#" className="flex items-center gap-2 font-medium">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-black text-primary-foreground">
                  <Image
                    src="/eco-water.svg"
                    alt="Logo"
                    width={20}
                    height={20}
                  />
                </div>
                {process.env.NEXT_PUBLIC_NAME}
              </a>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-xs">{children}</div>
            </div>
          </div>
          <div className="relative hidden bg-muted lg:block">
            <div className="absolute inset-0 h-full w-full bg-black">
              {/* Add blurred gradient spots */}
              <div className="absolute inset-0">
                <div className="absolute top-1 left-0 w-60 h-60 bg-gradient-to-r from-[#2463EB] to-emerald-500 rounded-full blur-[120px] opacity-40"></div>
                <div className="absolute bottom-1 right-0 w-60 h-60 bg-gradient-to-r from-[#2463EB] to-purple-500 rounded-full blur-[120px] opacity-40"></div>
              </div>
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Image
                  src="/eco-water.svg"
                  alt="Logo"
                  width={120}
                  height={120}
                />
                <h1 className="text-5xl font-bold text-white text-balance mb-2">
                  EcoWater
                </h1>
              </div>
            </div>
            {/* <img
            src="/eco-background.svg"
            alt="Image"
            className="absolute inset-0 h-full w-full bg-black  dark:brightness-[0.2] dark:grayscale p-20"
          /> */}
          </div>
        </div>
      </QueryClientProvider>
      <Toaster />
    </>
  );
}
