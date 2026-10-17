"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleMap, Marker, Polygon } from "@react-google-maps/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useGoogleMaps } from "@/providers/google-maps-provider";
import type { CircuitDraftEntry } from "@/types/zones/circuit-types";
import type { ZoneMeter } from "@/types/zones/zone-types";

interface ZonePolygonPoint {
  lat: number;
  lng: number;
}

interface ZoneCircuitMapProps {
  zoneColor: string;
  zonePolygon: ZonePolygonPoint[];
  candidateMeters: ZoneMeter[];
  draftEntries: CircuitDraftEntry[];
  operatorColorMap: Record<string, string>;
  onMeterClick: (meterId: string) => void;
}

function polygonCenter(polygon: ZonePolygonPoint[]): ZonePolygonPoint {
  if (polygon.length === 0) return { lat: 0, lng: 0 };
  const lat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
  return { lat, lng };
}

function numberedMarkerIcon(order: number, color: string): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="15" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="18" y="23" text-anchor="middle" font-size="${order >= 10 ? "11" : "13"}"
        font-weight="700" font-family="Arial,sans-serif" fill="white">${order}</text>
    </svg>`.trim();
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(36, 36),
    anchor: new google.maps.Point(18, 18),
  };
}

function candidateMarkerIcon(): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11" fill="#94a3b8" stroke="white" stroke-width="2.5" opacity="0.85"/>
      <circle cx="14" cy="14" r="4" fill="white"/>
    </svg>`.trim();
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(28, 28),
    anchor: new google.maps.Point(14, 14),
  };
}

export function ZoneCircuitMap({
  zoneColor,
  zonePolygon,
  candidateMeters,
  draftEntries,
  operatorColorMap,
  onMeterClick,
}: ZoneCircuitMapProps) {
  const { isLoaded } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const center = polygonCenter(zonePolygon);
  const assignedMeterIds = new Set(draftEntries.map((e) => e.meterId));

  const onLoad = useCallback((m: google.maps.Map) => {
    setMap(m);
  }, []);

  const onUnmount = useCallback(() => setMap(null), []);

  // Fit map to polygon bounds on first load
  useEffect(() => {
    if (!map || !isLoaded || zonePolygon.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    zonePolygon.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 40);
  }, [map, isLoaded, zonePolygon]);

  if (!isLoaded) {
    return <Skeleton className="w-full h-full rounded-md" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      }}
    >
      <Polygon
        paths={zonePolygon}
        options={{
          fillColor: zoneColor,
          fillOpacity: 0.12,
          strokeColor: zoneColor,
          strokeWeight: 2.5,
          clickable: false,
          zIndex: 1,
        }}
      />

      {/* Candidate meters (not yet in circuit) */}
      {candidateMeters
        .filter((m) => !assignedMeterIds.has(m.id) && m.lat != null && m.lng != null)
        .map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat!, lng: m.lng! }}
            icon={candidateMarkerIcon()}
            title={m.device_name}
            zIndex={5}
            onClick={() => onMeterClick(m.id)}
          />
        ))}

      {/* Numbered markers (already in circuit) */}
      {draftEntries.map((entry) => {
        const color = entry.assignedOperatorId
          ? (operatorColorMap[entry.assignedOperatorId] ?? zoneColor)
          : zoneColor;
        return (
          <Marker
            key={entry.meterId}
            position={{ lat: entry.lat, lng: entry.lng }}
            icon={numberedMarkerIcon(entry.order, color)}
            title={`${entry.order}. ${entry.device_name}`}
            zIndex={10}
            onClick={() => onMeterClick(entry.meterId)}
          />
        );
      })}
    </GoogleMap>
  );
}
