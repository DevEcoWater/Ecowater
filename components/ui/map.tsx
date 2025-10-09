"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { Skeleton } from "./skeleton";
import { chipConfig } from "@/utils/getChipColor";
import Chip from "./chip";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { MeterStatus } from "@prisma/client";
import { useMeters } from "@/hooks/meters/use-meters";
import { useGoogleMaps } from "@/providers/google-maps-provider";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { RefreshCw, Minimize2, Layers, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const center = {
  lat: -34.90813431153549,
  lng: -58.03651143251905,
};

function Map() {
  const { data, isLoading, error } = useMeters();
  const { data: cooperative } = useCooperative();
  const { isLoaded, loadError } = useGoogleMaps();
  const [showCoopInfo, setShowCoopInfo] = useState(false);

  console.log(cooperative, "cooperative data");

  const getChipForMeter = useCallback((status: MeterStatus) => {
    const styleKey = (
      status === "MAINTENANCE" ? "PENDING" : status
    ) as keyof typeof chipConfig;
    return chipConfig[styleKey] ?? chipConfig.DEFAULT;
  }, []);

  const cooperativePosition = useMemo(() => {
    if (!cooperative?.lat || !cooperative?.lng) return null;
    return {
      lat: cooperative.lat,
      lng: cooperative.lng,
    } as google.maps.LatLngLiteral;
  }, [cooperative]);

  // Map themes and custom controls
  type MapTheme = "standard" | "night" | "retro" | "satellite";
  const [mapTheme, setMapTheme] = useState<MapTheme>("standard");
  const [hidePoiLabels, setHidePoiLabels] = useState<boolean>(true);

  const THEME_STYLES: Record<
    Exclude<MapTheme, "satellite">,
    google.maps.MapTypeStyle[]
  > = {
    standard: [],
    night: [
      { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
      {
        featureType: "administrative.country",
        elementType: "geometry.stroke",
        stylers: [{ color: "#4b6878" }],
      },
      {
        featureType: "administrative.land_parcel",
        elementType: "labels.text.fill",
        stylers: [{ color: "#64779e" }],
      },
      {
        featureType: "administrative.province",
        elementType: "geometry.stroke",
        stylers: [{ color: "#4b6878" }],
      },
      {
        featureType: "landscape.man_made",
        elementType: "geometry.stroke",
        stylers: [{ color: "#334e87" }],
      },
      {
        featureType: "landscape.natural",
        elementType: "geometry",
        stylers: [{ color: "#023e58" }],
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#283d6a" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6f9ba5" }],
      },
      {
        featureType: "poi",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1d2c4d" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry.fill",
        stylers: [{ color: "#023e58" }],
      },
      {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#3C7680" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#304a7d" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#98a5be" }],
      },
      {
        featureType: "road",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1d2c4d" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#2c6675" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#255763" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#b0d5ce" }],
      },
      {
        featureType: "road.highway",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#023e58" }],
      },
      {
        featureType: "transit",
        elementType: "labels.text.fill",
        stylers: [{ color: "#98a5be" }],
      },
      {
        featureType: "transit",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#1d2c4d" }],
      },
      {
        featureType: "transit.line",
        elementType: "geometry.fill",
        stylers: [{ color: "#283d6a" }],
      },
      {
        featureType: "transit.station",
        elementType: "geometry",
        stylers: [{ color: "#3a4762" }],
      },
      {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0e1626" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4e6d70" }],
      },
    ],
    retro: [
      { elementType: "geometry", stylers: [{ color: "#ebe3cd" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1e6" }] },
      {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [{ color: "#c9b2a6" }],
      },
      {
        featureType: "poi",
        elementType: "geometry",
        stylers: [{ color: "#dfd2ae" }],
      },
      {
        featureType: "poi.park",
        elementType: "geometry.fill",
        stylers: [{ color: "#a5b076" }],
      },
      {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#f5f1e6" }],
      },
      {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#fdfcf8" }],
      },
      {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#f8c967" }],
      },
      {
        featureType: "road.highway.controlled_access",
        elementType: "geometry",
        stylers: [{ color: "#e98d58" }],
      },
      {
        featureType: "road.local",
        elementType: "labels.text.fill",
        stylers: [{ color: "#806b63" }],
      },
      {
        featureType: "water",
        elementType: "geometry.fill",
        stylers: [{ color: "#b9d3c2" }],
      },
      {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#92998d" }],
      },
    ],
  };

  const createMarkerIcon = useCallback((color: string) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
        <path fill="${color}" stroke="white" stroke-width="2" d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  // Optional: use external SVG asset and recolor it
  const [baseSvg, setBaseSvg] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    if (!baseSvg) {
      fetch("/meter-pin.svg")
        .then((r) => r.text())
        .then((txt) => {
          if (mounted) setBaseSvg(txt);
        })
        .catch(() => {
          // ignore; fallback uses inline SVG
        });
    }
    return () => {
      mounted = false;
    };
  }, [baseSvg]);

  const iconCacheRef = useRef<Record<string, string>>({});
  const createColoredIcon = useCallback(
    (color: string) => {
      const cache = iconCacheRef.current;
      if (cache[color]) return cache[color];
      if (baseSvg) {
        const colored = baseSvg.replace(
          /(id=\"pin\"[^>]*fill=\")#[0-9a-fA-F]{3,6}/,
          `$1${color}`
        );
        const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
          colored
        )}`;
        cache[color] = url;
        return url;
      }
      const url = createMarkerIcon(color);
      cache[color] = url;
      return url;
    },
    [baseSvg, createMarkerIcon]
  );

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [activeCluster, setActiveCluster] = useState<{
    position: google.maps.LatLng;
    markers: google.maps.Marker[];
  } | null>(null);
  const markerClusterRef = useRef<MarkerClusterer | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [clusterEnabled, setClusterEnabled] = useState<boolean>(true);

  const [visibleStatuses, setVisibleStatuses] = useState<
    Record<MeterStatus, boolean>
  >({
    ACTIVE: true,
    INACTIVE: true,
    MAINTENANCE: true,
    FAULTY: true,
  });

  const markers = useMemo(
    () => data?.filter((item: any) => item?.lat && item?.lng) || [],
    [data]
  );

  const filteredMarkers = useMemo(
    () =>
      markers.filter(
        (m: any) => visibleStatuses[(m.status as MeterStatus) ?? "ACTIVE"]
      ),
    [markers, visibleStatuses]
  );

  const bounds = useMemo(() => {
    if (!markers.length) return null as null | google.maps.LatLngBoundsLiteral;
    const lats = markers.map((m: any) => m.lat as number);
    const lngs = markers.map((m: any) => m.lng as number);
    const padding = 0.02;
    return {
      north: Math.max(...lats) + padding,
      south: Math.min(...lats) - padding,
      east: Math.max(...lngs) + padding,
      west: Math.min(...lngs) - padding,
    } as google.maps.LatLngBoundsLiteral;
  }, [markers]);

  const OPTIONS = useMemo(
    () => ({
      minZoom: 2,
      maxZoom: 18,
      restriction: {
        latLngBounds: {
          north: -34.9035949 + 0.01,
          south: -34.9035949 - 0.01,
          east: -58.0373327 + 0.01,
          west: -58.0373327 - 0.01,
        },
        strictBounds: true,
      },
      styles:
        mapTheme === "satellite"
          ? hidePoiLabels
            ? [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.icon",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "poi",
                  elementType: "labels.text",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "poi.business",
                  elementType: "all",
                  stylers: [{ visibility: "off" }],
                },
                {
                  featureType: "transit",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
              ]
            : undefined
          : [
              ...THEME_STYLES[
                (mapTheme as Exclude<MapTheme, "satellite">) || "standard"
              ],
              ...(hidePoiLabels
                ? [
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "poi",
                      elementType: "labels.icon",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "poi",
                      elementType: "labels.text",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "poi.business",
                      elementType: "all",
                      stylers: [{ visibility: "off" }],
                    },
                    {
                      featureType: "transit",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }],
                    },
                  ]
                : []),
            ],
      mapTypeId: (mapTheme === "satellite" ? "hybrid" : "roadmap") as any,
      gestureHandling: "greedy",
    }),
    [bounds, mapTheme, hidePoiLabels]
  );

  useEffect(() => {
    if (!map) return;

    if (markerClusterRef.current) {
      markerClusterRef.current.clearMarkers();
      markerClusterRef.current = null;
    }

    if (!clusterEnabled || zoomLevel >= 14 || filteredMarkers.length === 0) {
      return;
    }

    const googleMarkers = filteredMarkers.map((item: (typeof data)[number]) => {
      const status = item.status as MeterStatus;
      const { textColor } = getChipForMeter(status);

      return new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        icon: {
          url: createColoredIcon(textColor),
          scaledSize: new google.maps.Size(30, 45),
        },
      }) as google.maps.Marker;
    });

    const cluster = new MarkerClusterer({
      markers: googleMarkers,
      map,
      algorithm: new SuperClusterAlgorithm({
        radius: 150,
        minPoints: 2,
      }),
      onClusterClick: (event, cluster) => {
        event.stop();
        const clusterMarkers = cluster.markers as google.maps.Marker[];
        const position = clusterMarkers[0].getPosition()!;
        setActiveCluster({ position, markers: clusterMarkers });
        setActiveMarker(null);
      },
    });

    markerClusterRef.current = cluster;

    return () => {
      cluster.clearMarkers();
    };
  }, [
    map,
    filteredMarkers,
    zoomLevel,
    clusterEnabled,
    getChipForMeter,
    createColoredIcon,
  ]);

  const onLoad = useCallback(
    (gmap: google.maps.Map) => {
      if (bounds) {
        const gBounds = new window.google.maps.LatLngBounds(
          { lat: bounds.south, lng: bounds.west },
          { lat: bounds.north, lng: bounds.east }
        );
        gmap.fitBounds(gBounds);
      } else {
        // Usar zoom 8 y centro específico (igual que el botón RESET)
        gmap.setZoom(8);
        gmap.panTo(center as google.maps.LatLngLiteral);
      }
      setMap(gmap);

      gmap.addListener("zoom_changed", () => {
        setZoomLevel(gmap.getZoom() || 2);
      });
    },
    [bounds]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
    if (markerClusterRef.current) {
      markerClusterRef.current.clearMarkers();
      markerClusterRef.current = null;
    }
  }, []);

  const handleMarkerClick = (index: number) => {
    setActiveMarker((prev) => (prev === index ? null : index));
    setActiveCluster(null);
  };

  if (isLoading) return <Skeleton className="h-[617px] w-full bg-gray-300" />;
  if (error) return <p>Error: {error?.message}</p>;
  if (loadError) return <p>Error cargando el mapa: {loadError.message}</p>;

  return isLoaded ? (
    <GoogleMap
      options={OPTIONS}
      mapContainerStyle={containerStyle}
      center={center}
      zoom={8}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <div className="absolute right-4 top-4 z-[1] w-[280px]">
        <Collapsible defaultOpen>
          <div className="bg-white rounded-md shadow">
            <CollapsibleTrigger className="w-full text-left p-3 border-b text-sm font-semibold flex items-center justify-between">
              Controles <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 p-3">
                <div className="bg-white rounded-md p-2 border flex items-center gap-2">
                  <span className="text-sm font-medium">Estilo</span>
                  <Select
                    value={mapTheme}
                    onValueChange={(v) => setMapTheme(v as any)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Tema del mapa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Estándar</SelectItem>
                      <SelectItem value="night">Noche</SelectItem>
                      <SelectItem value="retro">Retro</SelectItem>
                      <SelectItem value="satellite">Satélite</SelectItem>
                    </SelectContent>
                  </Select>
                  <label className="flex items-center gap-2 text-sm ml-2">
                    <span>Off POI</span>
                    <Checkbox
                      checked={hidePoiLabels}
                      onCheckedChange={(v) => setHidePoiLabels(Boolean(v))}
                    />
                  </label>
                </div>
                <div className="rounded-md p-3 border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Agrupar
                    </span>
                    <Checkbox
                      checked={clusterEnabled}
                      onCheckedChange={(v) => setClusterEnabled(Boolean(v))}
                    />
                  </div>
                  <div className="flex flex-col gap-2 text-sm">
                    {(
                      [
                        "ACTIVE",
                        "MAINTENANCE",
                        "INACTIVE",
                        "FAULTY",
                      ] as MeterStatus[]
                    ).map((s) => (
                      <div
                        key={s}
                        className="flex items-center justify-between"
                      >
                        <Chip key={s} status={s} />

                        <Checkbox
                          checked={visibleStatuses[s]}
                          onCheckedChange={(v) =>
                            setVisibleStatuses((prev) => ({
                              ...prev,
                              [s]: Boolean(v),
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!map) return;
                        map.setZoom(8);
                        map.panTo(center as google.maps.LatLngLiteral);
                      }}
                    >
                      <RefreshCw className="w-4 h-4" /> Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {cooperativePosition && (
        <Marker
          position={cooperativePosition}
          icon={{
            url: "/house.svg",
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 40),
          }}
          onClick={() => setShowCoopInfo(true)} // 👈 al hacer click abrís el InfoWindow
        >
          {showCoopInfo && (
            <InfoWindow
              position={cooperativePosition}
              onCloseClick={() => setShowCoopInfo(false)}
            >
              <div className="p-3 bg-white rounded-lg shadow-md flex flex-col items-center gap-2 min-w-[180px]">
                <p className="text-base font-semibold">{cooperative.name}</p>
                <p className="text-sm text-gray-600">Estación central</p>

                <button
                  onClick={() =>
                    window.open("https://www.cosego.com.ar/", "_blank")
                  }
                  className="mt-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition"
                >
                  Visitar sitio
                </button>
              </div>
            </InfoWindow>
          )}
        </Marker>
      )}

      {(zoomLevel >= 14 || !clusterEnabled) &&
        filteredMarkers.map((item: (typeof data)[number], index: number) => {
          const status = item.status as MeterStatus;
          const { textColor } = getChipForMeter(status);
          return (
            <Marker
              key={index}
              position={{
                lat: item.lat,
                lng: item.lng,
              }}
              onClick={() => handleMarkerClick(index)}
              icon={{
                url: createColoredIcon(textColor),
                scaledSize: new google.maps.Size(30, 45),
              }}
            >
              {activeMarker === index && (
                <InfoWindow
                  position={{
                    lat: item.lat,
                    lng: item.lng,
                  }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-2 bg-white rounded shadow-lg flex flex-col justify-start items-start gap-4">
                    <div className="flex gap-2 justify-between w-full items-center">
                      <p className="text-balance text-sm text-muted-foreground">
                        EUI
                      </p>
                      <p className="text-balance text-md text-left font-medium">
                        {item.dev_eui}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-between w-full items-center">
                      <p className="text-balance text-sm text-muted-foreground">
                        Ultima actualización
                      </p>
                      <p className="text-balance text-md text-left font-medium">
                        {new Date(item.updated_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2 justify-between w-full items-center">
                      <p className="text-balance text-sm text-muted-foreground">
                        Estado
                      </p>
                      <Chip status={item.status} />
                    </div>
                    <div>
                      <Link
                        href={`/dashboard/medidores/${item.id}`}
                        className="text-primary underline"
                      >
                        Ver medidor
                      </Link>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}

      {activeCluster && (
        <InfoWindow
          position={activeCluster.position}
          onCloseClick={() => setActiveCluster(null)}
        >
          <div className="p-2 bg-white rounded shadow-lg max-w-xs">
            <h3 className="text-lg font-bold">Información de la zona</h3>
            <p className="text-sm text-gray-600">
              {activeCluster.markers.length} medidores en la zona
            </p>

            <div className="list-disc pl-4 mt-2 text-sm text-gray-800 max-h-64 overflow-y-auto">
              {activeCluster.markers.map((marker, index) => {
                const m = marker as google.maps.Marker;
                const position = m.getPosition();
                const markerData = markers.find(
                  (item: any) =>
                    item.lat === position?.lat() && item.lng === position?.lng()
                );

                return (
                  markerData && (
                    <p className="my-4" key={index}>
                      <Chip status={markerData.status} />{" "}
                      <Link
                        href={`/dashboard/medidores/${markerData.id}`}
                        className="text-primary underline"
                      >
                        Ver medidor
                      </Link>
                    </p>
                  )
                );
              })}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : (
    <Skeleton className="h-[617px] w-full bg-gray-300" />
  );
}

export default React.memo(Map);
