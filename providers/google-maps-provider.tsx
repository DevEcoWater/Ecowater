"use client";

import { createContext, useContext, type ReactNode } from "react";
import { Libraries, useJsApiLoader } from "@react-google-maps/api";

const defaultLibraries: Libraries = ["places"];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | null>(null);

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error(
      "useGoogleMaps debe ser usado dentro de un GoogleMapsProvider"
    );
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: ReactNode;
  apiKey?: string;
  libraries?: Libraries;
}

export function GoogleMapsProvider({
  children,
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
  libraries = defaultLibraries,
}: GoogleMapsProviderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries: libraries as Libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
