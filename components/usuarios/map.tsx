"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";

interface UserLocationMapProps {
  initialLocation: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readOnly?: boolean;
  height?: string;
  width?: string;
  zoom?: number;
}

function UserLocationMap({
  initialLocation,
  onLocationChange,
  readOnly = false,
  height = "300px",
  width = "100%",
  zoom = 14,
}: UserLocationMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(initialLocation);

  useEffect(() => {
    setMarkerPosition(initialLocation);
  }, [initialLocation]);

  const containerStyle = {
    width,
    height,
  };

  const options = {
    disableDefaultUI: readOnly,
    zoomControl: !readOnly,
    scrollwheel: !readOnly,
    draggable: !readOnly,
    clickableIcons: !readOnly,
    minZoom: 2,
    maxZoom: 18,
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (readOnly || !e.latLng || !onLocationChange) return;

      const newPosition = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      setMarkerPosition(newPosition);
      onLocationChange(newPosition);
    },
    [readOnly, onLocationChange]
  );

  if (!isLoaded) return <Skeleton className={`w-full h-[${height}]`} />;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={markerPosition}
      zoom={zoom}
      options={options}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
    >
      <Marker
        position={markerPosition}
        draggable={!readOnly}
        onDragEnd={(e: google.maps.MapMouseEvent) => {
          if (e.latLng && onLocationChange) {
            const newPosition = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            setMarkerPosition(newPosition);
            onLocationChange(newPosition);
          }
        }}
      />
    </GoogleMap>
  );
}

export default React.memo(UserLocationMap);
