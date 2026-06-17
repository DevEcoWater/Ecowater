"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { GoogleMap, Marker, InfoWindow, DrawingManager, Polygon } from "@react-google-maps/api";
import { Skeleton } from "./skeleton";
import { chipConfig } from "@/utils/getChipColor";
import Chip from "./chip";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { MeterStatus } from "@prisma/client";
import { useMapMetersQuery } from "@/hooks/meters/use-meter-query";
import { MapMeter, ValveStatus } from "@/types/meters/meter-types";
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
import { RefreshCw, Layers, ChevronDown, PenLine, X, ExternalLink, MapPin, Check, Cpu, Wrench, Search, Clock, Gauge, Droplets } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCooperative } from "@/hooks/cooperative/user-cooperative";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useZonesQuery, useCreateZoneMutation, useUpdateZoneMutation } from "@/hooks/zones/use-zones";
import { Zone, ZonePolygonPoint } from "@/types/zones/zone-types";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const containerStyle = {
  width: "100%",
  // 64px header offset (mt-16) + 8px pt-2 + ~116px page-header + 49px separator (my-6) + 8px pb-2 = ~245px chrome
  height: "calc(100svh - 265px)",
};

const center = {
  lat: -34.90813431153549,
  lng: -58.03651143251905,
};

function Map() {
  const { data, isLoading, error } = useMapMetersQuery();
  const { data: cooperative } = useCooperative();
  const { isLoaded, loadError } = useGoogleMaps();
  const [showCoopInfo, setShowCoopInfo] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Zones
  const { data: zones = [] } = useZonesQuery();
  const createZone = useCreateZoneMutation();
  const updateZone = useUpdateZoneMutation();
  const editingPolygonRef = useRef<google.maps.Polygon | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [pendingPolygon, setPendingPolygon] = useState<google.maps.Polygon | null>(null);
  const [pendingCoords, setPendingCoords] = useState<ZonePolygonPoint[]>([]);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneColor, setNewZoneColor] = useState("#3B82F6");
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);

  const computeCentroid = useCallback((polygon: ZonePolygonPoint[]) => {
    const lat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
    const lng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
    return { lat, lng };
  }, []);

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

  // Smart meter: teardrop with a small valve-status dot in the inner circle
  // open → green, closed → red, anything else → no dot (transparent)
  const createSmartIcon = useCallback((color: string, valveStatus: ValveStatus | null) => {
    const dotColor =
      valveStatus === "open"
        ? "#10B981"
        : valveStatus === "closed"
          ? "#EF4444"
          : "transparent";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="${color}" stroke="white" stroke-width="2" d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/><circle cx="12" cy="12" r="3.5" fill="${dotColor}"/></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  // Mechanical meter: filled circle with wrench-square — clearly distinct from teardrop
  const createMechanicalMarkerIcon = useCallback((color: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="30" height="30"><circle cx="15" cy="15" r="13" fill="${color}" stroke="white" stroke-width="2.5"/><rect x="9" y="9" width="12" height="12" rx="2" fill="white"/><rect x="12" y="12" width="6" height="6" rx="1" fill="${color}"/></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  const smartIconCacheRef = useRef<Record<string, string>>({});
  const getSmartIcon = useCallback(
    (color: string, valveStatus: ValveStatus | null) => {
      const key = `${color}|${valveStatus ?? "none"}`;
      const cache = smartIconCacheRef.current;
      if (cache[key]) return cache[key];
      const url = createSmartIcon(color, valveStatus);
      cache[key] = url;
      return url;
    },
    [createSmartIcon]
  );

  const mechanicalIconCacheRef = useRef<Record<string, string>>({});
  const createMechanicalColoredIcon = useCallback(
    (color: string) => {
      const cache = mechanicalIconCacheRef.current;
      if (cache[color]) return cache[color];
      const url = createMechanicalMarkerIcon(color);
      cache[color] = url;
      return url;
    },
    [createMechanicalMarkerIcon]
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

  const [typeFilter, setTypeFilter] = useState<"ALL" | "SMART" | "MECHANICAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const markers = useMemo(
    () => data?.filter((item: any) => item?.lat && item?.lng) || [],
    [data]
  );

  const filteredMarkers = useMemo(
    () =>
      markers
        .filter((m: any) => visibleStatuses[(m.status as MeterStatus) ?? "ACTIVE"])
        .filter((m: any) => typeFilter === "ALL" || m.meter_type === typeFilter)
        .filter((m: any) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            m.device_name?.toLowerCase().includes(q) ||
            m.dev_eui?.toLowerCase().includes(q) ||
            m.street_address?.toLowerCase().includes(q)
          );
        }),
    [markers, visibleStatuses, typeFilter, searchQuery]
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

  // Larger than fitBounds padding (0.02) so user can pan beyond the outermost meters
  const RESTRICTION_PADDING = 0.05;

  const restrictionBounds = useMemo(() => {
    // Priority 1: derive from meters
    if (bounds) {
      return {
        north: bounds.north + RESTRICTION_PADDING,
        south: bounds.south - RESTRICTION_PADDING,
        east:  bounds.east  + RESTRICTION_PADDING,
        west:  bounds.west  - RESTRICTION_PADDING,
      };
    }
    // Priority 2: derive from cooperative position
    if (cooperativePosition) {
      return {
        north: cooperativePosition.lat + RESTRICTION_PADDING,
        south: cooperativePosition.lat - RESTRICTION_PADDING,
        east:  cooperativePosition.lng + RESTRICTION_PADDING,
        west:  cooperativePosition.lng - RESTRICTION_PADDING,
      };
    }
    // Priority 3: hardcoded fallback (current behavior)
    return {
      north: -34.9035949 + RESTRICTION_PADDING,
      south: -34.9035949 - RESTRICTION_PADDING,
      east:  -58.0373327 + RESTRICTION_PADDING,
      west:  -58.0373327 - RESTRICTION_PADDING,
    };
  }, [bounds, cooperativePosition]);

  const meterCounts = useMemo(() => {
    const smart   = filteredMarkers.filter((m: MapMeter) => m.meter_type !== "MECHANICAL");
    const mech    = filteredMarkers.filter((m: MapMeter) => m.meter_type === "MECHANICAL");
    const open    = smart.filter((m: MapMeter) => m.valve_status === "open");
    const closed  = smart.filter((m: MapMeter) => m.valve_status === "closed");
    const online  = filteredMarkers.filter((m: MapMeter) => m.status === "ACTIVE");
    const total   = filteredMarkers.length;
    const onlinePct = total > 0 ? Math.round((online.length / total) * 100) : 0;
    return {
      total,
      smart:  smart.length,
      mech:   mech.length,
      open:   open.length,
      closed: closed.length,
      online: online.length,
      onlinePct,
    };
  }, [filteredMarkers]);

  const OPTIONS = useMemo(
    () => ({
      minZoom: 2,
      maxZoom: 18,
      restriction: {
        latLngBounds: restrictionBounds,
        strictBounds: true,
      },
      zoomControl: true,
      zoomControlOptions: { position: 7 }, // 7 = RIGHT_BOTTOM in google.maps.ControlPosition
      mapTypeControl: false,    // redundant — custom theme selector exists in the panel
      streetViewControl: false, // declutter
      fullscreenControl: false, // declutter — panel already constrained to map area
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
    [restrictionBounds, mapTheme, hidePoiLabels]
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
      const isMech = item.meter_type === "MECHANICAL";

      const vs = isMech ? null : ((item as MapMeter).valve_status ?? null);
      return new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        icon: {
          url: isMech
            ? createMechanicalColoredIcon(textColor)
            : getSmartIcon(textColor, vs),
          scaledSize: isMech ? new google.maps.Size(30, 30) : new google.maps.Size(30, 45),
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
    getSmartIcon,
    createMechanicalColoredIcon,
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

  const handlePolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      const coords: ZonePolygonPoint[] = polygon
        .getPath()
        .getArray()
        .map((latlng) => ({ lat: latlng.lat(), lng: latlng.lng() }));
      setPendingPolygon(polygon);
      setPendingCoords(coords);
      setZoneDialogOpen(true);
      setDrawingMode(false);
    },
    []
  );

  const handleSaveZone = useCallback(async () => {
    if (!newZoneName.trim()) return;
    try {
      await createZone.mutateAsync({
        name: newZoneName.trim(),
        color: newZoneColor,
        polygon: pendingCoords,
      });
      pendingPolygon?.setMap(null);
      setPendingPolygon(null);
      setPendingCoords([]);
      setNewZoneName("");
      setNewZoneColor("#3B82F6");
      setZoneDialogOpen(false);
      toast({ title: "Zona creada correctamente" });
    } catch {
      toast({ title: "Error al crear zona", variant: "destructive" });
    }
  }, [newZoneName, newZoneColor, pendingCoords, pendingPolygon, createZone, toast]);

  const handleCancelZone = useCallback(() => {
    pendingPolygon?.setMap(null);
    setPendingPolygon(null);
    setPendingCoords([]);
    setNewZoneName("");
    setNewZoneColor("#3B82F6");
    setZoneDialogOpen(false);
  }, [pendingPolygon]);

  const handleSaveEditZone = useCallback(async () => {
    if (!editingZone || !editingPolygonRef.current) return;
    const coords: ZonePolygonPoint[] = editingPolygonRef.current
      .getPath()
      .getArray()
      .map((latlng) => ({ lat: latlng.lat(), lng: latlng.lng() }));
    try {
      await updateZone.mutateAsync({ id: editingZone.id, polygon: coords });
      setEditingZone(null);
      editingPolygonRef.current = null;
      toast({ title: "Zona actualizada correctamente" });
    } catch {
      toast({ title: "Error al guardar zona", variant: "destructive" });
    }
  }, [editingZone, updateZone, toast]);

  const handleCancelEditZone = useCallback(() => {
    setEditingZone(null);
    editingPolygonRef.current = null;
  }, []);

  if (isLoading) return <Skeleton className="h-[617px] w-full bg-gray-300" />;
  if (error) return <p>Error: {error?.message}</p>;
  if (loadError) return <p>Error cargando el mapa: {loadError.message}</p>;

  const mapContent = isLoaded ? (
    <GoogleMap
      options={OPTIONS}
      mapContainerStyle={containerStyle}
      center={center}
      zoom={8}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      <div className="absolute right-4 top-4 z-[1] w-[280px] max-h-[calc(100%-2rem)] overflow-y-auto">
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
                    <span>Ocultar POI</span>
                    <Checkbox
                      checked={hidePoiLabels}
                      onCheckedChange={(v) => setHidePoiLabels(Boolean(v))}
                    />
                  </label>
                </div>
                {/* Meter type + search filters */}
                <div className="rounded-md p-3 border space-y-2">
                  <div className="flex items-center rounded-md border overflow-hidden text-xs">
                    {(
                      [
                        { label: "Todos", value: "ALL" as const },
                        { label: "Smart", value: "SMART" as const, icon: <Cpu className="w-3 h-3" /> },
                        { label: "Mecánicos", value: "MECHANICAL" as const, icon: <Wrench className="w-3 h-3" /> },
                      ] as { label: string; value: "ALL" | "SMART" | "MECHANICAL"; icon?: React.ReactNode }[]
                    ).map(({ label, value, icon }) => (
                      <button
                        key={value}
                        onClick={() => setTypeFilter(value)}
                        className={`flex-1 flex items-center justify-center gap-1 py-1 text-xs transition-colors ${
                          typeFilter === value
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar medidor..."
                      className="pl-7 h-7 text-xs"
                    />
                  </div>
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
                        if (bounds) {
                          map.fitBounds(new window.google.maps.LatLngBounds(
                            { lat: bounds.south, lng: bounds.west },
                            { lat: bounds.north, lng: bounds.east }
                          ));
                        } else if (cooperativePosition) {
                          map.setZoom(14);
                          map.panTo(cooperativePosition);
                        } else {
                          map.setZoom(8);
                          map.panTo(center as google.maps.LatLngLiteral);
                        }
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

        {/* Zones panel */}
        <Collapsible defaultOpen className="mt-2">
          <div className="bg-white rounded-md shadow">
            <CollapsibleTrigger className="w-full text-left p-3 border-b text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Zonas ({zones.length})
              </span>
              <ChevronDown className="w-4 h-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-2 space-y-1 max-h-[280px] overflow-y-auto">
                {zones.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No hay zonas creadas
                  </p>
                ) : (
                  zones.map((zone: Zone) => {
                    const centroid = computeCentroid(zone.polygon);
                    const statusLabel =
                      zone.status === "ACTIVE"
                        ? "Activa"
                        : zone.status === "UPCOMING"
                        ? "Próxima"
                        : "Inactiva";
                    const statusClass =
                      zone.status === "ACTIVE"
                        ? "text-green-700 bg-green-50"
                        : zone.status === "UPCOMING"
                        ? "text-yellow-700 bg-yellow-50"
                        : "text-gray-500 bg-gray-100";

                    return (
                      <div
                        key={zone.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer group"
                        onClick={() => {
                          if (!map) return;
                          map.panTo(centroid);
                          map.setZoom(15);
                          setActiveZone(zone);
                          setActiveMarker(null);
                          setActiveCluster(null);
                        }}
                      >
                        {/* Color dot */}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: zone.color }}
                        />
                        {/* Name */}
                        <span className="text-xs font-medium flex-1 truncate">
                          {zone.name}
                        </span>
                        {/* Status */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusClass}`}>
                          {statusLabel}
                        </span>
                        {/* Edit link */}
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/zonas/${zone.id}`);
                          }}
                          title="Editar zona"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                        </button>
                      </div>
                    );
                  })
                )}
                <div className="pt-1 border-t mt-1">
                  <Button
                    size="sm"
                    variant={drawingMode ? "default" : "outline"}
                    className="w-full text-xs"
                    onClick={() => setDrawingMode((v) => !v)}
                  >
                    {drawingMode ? (
                      <><X className="w-3.5 h-3.5" /> Cancelar dibujo</>
                    ) : (
                      <><PenLine className="w-3.5 h-3.5" /> Nueva zona</>
                    )}
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Meter count summary overlay — bottom-left */}
      <div className="absolute bottom-8 left-4 z-[1] bg-card/95 backdrop-blur-sm rounded-xl shadow-md border border-border/50 px-4 py-3 min-w-[170px] pointer-events-none">
        {/* Total + health pct */}
        <div className="flex items-end justify-between gap-3 mb-2">
          <div>
            <p className="text-2xl font-bold leading-none text-foreground">{meterCounts.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">medidores</p>
          </div>
          {meterCounts.total > 0 && (() => {
            const pct = meterCounts.onlinePct;
            const [color, bg] = pct >= 80
              ? ["#16a34a", "#dcfce7"]
              : pct >= 50
              ? ["#d97706", "#fef3c7"]
              : ["#dc2626", "#fee2e2"];
            return (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ color, backgroundColor: bg }}
              >
                {pct}% en línea
              </span>
            );
          })()}
        </div>

        {/* Type breakdown */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <span>{meterCounts.smart} inteligentes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{meterCounts.mech} mecánicos</span>
          </div>
        </div>

        {/* Valve breakdown (smart only) */}
        {meterCounts.smart > 0 && (
          <div className="mt-2 pt-2 border-t border-border/40 flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {meterCounts.open} abierta
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              {meterCounts.closed} cerrada
            </span>
          </div>
        )}
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
          const isMech = item.meter_type === "MECHANICAL";
          return (
            <Marker
              key={index}
              position={{
                lat: item.lat,
                lng: item.lng,
              }}
              onClick={() => handleMarkerClick(index)}
              icon={{
                url: isMech
                  ? createMechanicalColoredIcon(textColor)
                  : getSmartIcon(textColor, (item as MapMeter).valve_status ?? null),
                scaledSize: isMech ? new google.maps.Size(30, 30) : new google.maps.Size(30, 45),
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
                  <div className="min-w-[210px] max-w-[240px] py-0.5 space-y-2.5">
                    {/* Header: type icon + name + status chip */}
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0 text-gray-400">
                        {isMech
                          ? <Gauge className="w-4 h-4" />
                          : <Droplets className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-tight truncate">
                          {item.device_name}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                          {isMech ? "Mecánico" : "Inteligente"}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Chip status={item.status} />
                      </div>
                    </div>

                    {/* Valve pill (smart only) */}
                    {!isMech && (() => {
                      const vs = (item as MapMeter).valve_status;
                      const [label, cls] = vs === "open"
                        ? ["Válvula abierta", "bg-emerald-50 text-emerald-700 border border-emerald-200"]
                        : vs === "closed"
                        ? ["Válvula cerrada", "bg-red-50 text-red-700 border border-red-200"]
                        : vs === "abnormal"
                        ? ["Válvula anormal", "bg-orange-50 text-orange-700 border border-orange-200"]
                        : ["Válvula desc.", "bg-gray-50 text-gray-400 border border-gray-200"];
                      return (
                        <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
                          {label}
                        </span>
                      );
                    })()}

                    {/* Identifier — address (mech) or partial EUI (smart) */}
                    {(isMech ? item.street_address : item.dev_eui) && (
                      <p className="text-[11px] text-gray-500 font-mono truncate">
                        {isMech
                          ? item.street_address
                          : `···${item.dev_eui!.slice(-8)}`}
                      </p>
                    )}

                    {/* Last reading */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {(item as MapMeter).last_reading_at
                          ? dayjs((item as MapMeter).last_reading_at).fromNow()
                          : "Sin lecturas"}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/dashboard/medidores/${item.id}`}
                      className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                    >
                      Ver medidor
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/></svg>
                    </Link>
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
          <div className="min-w-[220px] max-w-[260px] py-0.5">
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-sm font-semibold text-gray-900">
                {activeCluster.markers.length} medidores
              </p>
              <span className="text-[10px] text-gray-400 font-medium">en esta zona</span>
            </div>

            {/* Meter list */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
              {activeCluster.markers.map((marker, index) => {
                const m = marker as google.maps.Marker;
                const position = m.getPosition();
                const markerData = markers.find(
                  (item: any) =>
                    item.lat === position?.lat() && item.lng === position?.lng()
                );

                if (!markerData) return null;

                const isClusterMech = markerData.meter_type === "MECHANICAL";

                return (
                  <Link
                    key={index}
                    href={`/dashboard/medidores/${markerData.id}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="shrink-0 text-gray-400">
                      {isClusterMech
                        ? <Gauge className="w-3.5 h-3.5" />
                        : <Droplets className="w-3.5 h-3.5 text-blue-500" />}
                    </div>
                    <p className="flex-1 text-xs font-medium text-gray-800 truncate">
                      {markerData.device_name}
                    </p>
                    <Chip status={markerData.status} />
                  </Link>
                );
              })}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Zone polygons + labels */}
      {zones.map((zone: Zone) => {
        const isEditing = editingZone?.id === zone.id;
        const centroid = computeCentroid(zone.polygon);
        const isHovered = hoveredZoneId === zone.id;
        return (
          <React.Fragment key={zone.id}>
            {isEditing ? (
              /* Fresh key forces remount so onLoad always fires when entering edit mode */
              <Polygon
                key={`${zone.id}-edit`}
                paths={zone.polygon}
                options={{
                  fillColor: zone.color,
                  fillOpacity: 0.3,
                  strokeColor: zone.color,
                  strokeWeight: 3,
                  clickable: false,
                  editable: true,
                  draggable: false,
                  zIndex: 10,
                }}
                onLoad={(poly) => { editingPolygonRef.current = poly; }}
              />
            ) : (
              <Polygon
                key={zone.id}
                paths={zone.polygon}
                options={{
                  fillColor: zone.color,
                  fillOpacity: isHovered ? 0.38 : 0.18,
                  strokeColor: zone.color,
                  strokeWeight: isHovered ? 3 : 2,
                  clickable: true,
                  editable: false,
                  zIndex: 1,
                }}
                onMouseOver={() => { if (!editingZone) setHoveredZoneId(zone.id); }}
                onMouseOut={() => setHoveredZoneId(null)}
                onClick={() => {
                  setActiveZone(zone);
                  setActiveMarker(null);
                  setActiveCluster(null);
                }}
              />
            )}
            {/* Zone name label — hide while editing */}
            {!isEditing && (
              <Marker
                position={centroid}
                icon={{
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=",
                  scaledSize: new google.maps.Size(1, 1),
                }}
                label={{
                  text: zone.name,
                  color: zone.color,
                  fontWeight: "700",
                  fontSize: "13px",
                }}
                clickable={false}
                zIndex={2}
              />
            )}
          </React.Fragment>
        );
      })}

      {/* Active zone InfoWindow */}
      {activeZone && !editingZone && (
        <InfoWindow
          position={computeCentroid(activeZone.polygon)}
          onCloseClick={() => setActiveZone(null)}
        >
          <div className="p-1 min-w-[170px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeZone.color }}
              />
              <span className="font-semibold text-sm">{activeZone.name}</span>
            </div>
            {activeZone.status && (
              <p className="text-xs text-gray-500 mb-2.5">
                {activeZone.status === "ACTIVE"
                  ? "Activa"
                  : activeZone.status === "UPCOMING"
                  ? "Próxima"
                  : "Inactiva"}
              </p>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => { router.push(`/dashboard/zonas/${activeZone.id}`); setActiveZone(null); }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded transition"
              >
                Ver zona
              </button>
              <button
                onClick={() => { setEditingZone(activeZone); setActiveZone(null); }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded transition flex items-center justify-center gap-1"
              >
                <PenLine className="w-3 h-3" /> Editar polígono
              </button>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* Edit mode controls bar */}
      {editingZone && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1] bg-white rounded-xl shadow-lg border px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: editingZone.color }} />
            Editando: <span className="font-semibold">{editingZone.name}</span>
            <span className="text-xs text-muted-foreground font-normal ml-1">— arrastrá los puntos para cambiar la forma</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEditZone} disabled={updateZone.isPending}>
              <Check className="w-3.5 h-3.5 mr-1" />
              {updateZone.isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEditZone}>
              <X className="w-3.5 h-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* DrawingManager */}
      {drawingMode && (
        <DrawingManager
          drawingMode={window.google?.maps?.drawing?.OverlayType?.POLYGON}
          options={{
            drawingControl: false,
            polygonOptions: {
              fillColor: newZoneColor,
              fillOpacity: 0.25,
              strokeColor: newZoneColor,
              strokeWeight: 2,
              editable: false,
            },
          }}
          onPolygonComplete={handlePolygonComplete}
        />
      )}
    </GoogleMap>
  ) : (
    <Skeleton className="h-[617px] w-full bg-gray-300" />
  );

  return (
    <>
      {mapContent}
      <Dialog open={zoneDialogOpen} onOpenChange={(open) => { if (!open) handleCancelZone(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="zone-name">Nombre</Label>
              <Input
                id="zone-name"
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="Ej: Zona Norte"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="zone-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="zone-color"
                  type="color"
                  value={newZoneColor}
                  onChange={(e) => setNewZoneColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border"
                />
                <span className="text-sm text-muted-foreground">{newZoneColor}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelZone}>Cancelar</Button>
            <Button
              onClick={handleSaveZone}
              disabled={!newZoneName.trim() || createZone.isPending}
            >
              {createZone.isPending ? "Guardando..." : "Guardar zona"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default React.memo(Map);
