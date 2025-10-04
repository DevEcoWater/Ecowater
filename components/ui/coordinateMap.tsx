"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleMaps } from "@/providers/google-maps-provider";

interface CoordinateMapProps {
  initialLocation: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readOnly?: boolean;
  height?: string;
  width?: string;
  zoom?: number;
  className?: string;
  title?: string;
}

function CoordinateMap({
  initialLocation,
  onLocationChange,
  readOnly = false,
  height = "300px",
  width = "100%",
  zoom = 14,
  className = "",
  title,
}: CoordinateMapProps) {
  const { isLoaded } = useGoogleMaps();

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
    minZoom: 15,
    maxZoom: 17,
    restriction: {
      latLngBounds: {
        north: -34.9035949 + 0.01,
        south: -34.9035949 - 0.01,
        east: -58.0373327 + 0.01,
        west: -58.0373327 - 0.01,
      },
      strictBounds: true,
    },
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

  if (!isLoaded)
    return <Skeleton className={`w-full h-[${height}] ${className}`} />;

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition}
        zoom={zoom}
        options={options}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}>
        <Marker
          position={markerPosition}
          title={title}
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
    </div>
  );
}

export default React.memo(CoordinateMap);
