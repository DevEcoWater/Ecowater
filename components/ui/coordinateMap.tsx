"use client";

import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleMaps } from "@/providers/google-maps-provider";

interface ZoneOverlay {
  id: string;
  name: string;
  color: string;
  polygon: { lat: number; lng: number }[];
}

interface CoordinateMapProps {
  initialLocation: { lat: number; lng: number };
  onLocationChange?: (location: { lat: number; lng: number }) => void;
  readOnly?: boolean;
  height?: string;
  width?: string;
  zoom?: number;
  className?: string;
  title?: string;
  zones?: ZoneOverlay[];
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
  zones,
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

  const options: google.maps.MapOptions = {
    disableDefaultUI: readOnly,
    zoomControl: !readOnly,
    scrollwheel: !readOnly,
    draggable: !readOnly,
    clickableIcons: !readOnly,
    // Restrict area only on interactive maps without zone overlays (e.g. meter placement).
    // Read-only maps display whatever location they receive — no restriction needed.
    ...(!readOnly && !zones
      ? {
          minZoom: 15,
          maxZoom: 17,
          restriction: {
            latLngBounds: {
              north: initialLocation.lat + 0.03,
              south: initialLocation.lat - 0.03,
              east: initialLocation.lng + 0.03,
              west: initialLocation.lng - 0.03,
            },
            strictBounds: true,
          },
        }
      : {}),
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
        onClick={handleMapClick}
      >
        {zones?.map((zone) => (
          <Polygon
            key={zone.id}
            paths={zone.polygon}
            options={{
              fillColor: zone.color,
              fillOpacity: 0.18,
              strokeColor: zone.color,
              strokeWeight: 2,
              clickable: false,
              zIndex: 1,
            }}
          />
        ))}
        <Marker
          position={markerPosition}
          title={title}
          draggable={!readOnly}
          zIndex={10}
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
