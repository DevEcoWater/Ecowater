"use client";

import { useState, useCallback, useMemo } from "react";
import { ListOrdered, X } from "lucide-react";
import { GoogleMap, Marker, Polygon, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/providers/google-maps-provider";
import { useUpdateZoneMutation } from "@/hooks/zones/use-zones";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZonePolygonPoint } from "@/types/zones/zone-types";
import { ReadingRouteItem } from "@/types/operarios/operario-types";

// Fixed color palette — consistent with the project (blue, amber, purple, emerald…)
const OPERATOR_COLORS = [
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const UNASSIGNED_COLOR = "#9CA3AF";

interface Operator {
  id: string;
  name: string;
}

interface ZoneRouteMapProps {
  zoneId: string;
  polygon: ZonePolygonPoint[];
  meters: ReadingRouteItem[];
  operators: Operator[];
  initialRouteOrder: string[] | null;
  initialAssignments: Record<string, string> | null;
}

const MAP_CONTAINER_STYLE = { width: "100%", height: "400px" };

function computeCentroid(polygon: ZonePolygonPoint[]): { lat: number; lng: number } {
  if (polygon.length === 0) return { lat: -34.6037, lng: -58.3816 };
  const lat = polygon.reduce((s, p) => s + p.lat, 0) / polygon.length;
  const lng = polygon.reduce((s, p) => s + p.lng, 0) / polygon.length;
  return { lat, lng };
}

export function ZoneRouteMap({
  zoneId,
  polygon,
  meters,
  operators,
  initialRouteOrder,
  initialAssignments,
}: ZoneRouteMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const { toast } = useToast();
  const updateZone = useUpdateZoneMutation();

  // meterId → operatorId
  const [assignments, setAssignments] = useState<Record<string, string>>(
    initialAssignments ?? {}
  );

  // Global click order — only contains assigned meters
  const [order, setOrder] = useState<string[]>(() => {
    const assigned = new Set(Object.keys(initialAssignments ?? {}));
    return (initialRouteOrder ?? []).filter((id) => assigned.has(id));
  });

  // The "active brush" operator — defaults to the first one
  const [activeOperatorId, setActiveOperatorId] = useState<string | null>(
    operators[0]?.id ?? null
  );

  const center = computeCentroid(polygon);

  // Build operatorId → color map
  const operatorColorMap = useMemo(
    () =>
      Object.fromEntries(
        operators.map((op, idx) => [op.id, OPERATOR_COLORS[idx % OPERATOR_COLORS.length]])
      ),
    [operators]
  );

  // Filtered initial order (for hasChanges comparison)
  const initialOrderFiltered = useMemo(() => {
    const assigned = new Set(Object.keys(initialAssignments ?? {}));
    return (initialRouteOrder ?? []).filter((id) => assigned.has(id));
  }, [initialRouteOrder, initialAssignments]);

  const hasChanges =
    JSON.stringify(order) !== JSON.stringify(initialOrderFiltered) ||
    JSON.stringify(assignments) !== JSON.stringify(initialAssignments ?? {});

  const onMapLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      if (polygon.length === 0) return;
      const bounds = new window.google.maps.LatLngBounds();
      polygon.forEach((p) => bounds.extend(p));
      mapInstance.fitBounds(bounds, 60);
    },
    [polygon]
  );

  const handleMeterClick = useCallback(
    (meterId: string) => {
      if (!activeOperatorId) return;

      const currentOwner = assignments[meterId];

      if (currentOwner === activeOperatorId) {
        // Same operator clicked again → deassign
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[meterId];
          return next;
        });
        setOrder((prev) => prev.filter((id) => id !== meterId));
      } else if (!currentOwner) {
        // Unassigned → assign + append to global order
        setAssignments((prev) => ({ ...prev, [meterId]: activeOperatorId }));
        setOrder((prev) => [...prev, meterId]);
      } else {
        // Reassign from another operator → keep position in order, only change owner
        setAssignments((prev) => ({ ...prev, [meterId]: activeOperatorId }));
      }
    },
    [activeOperatorId, assignments]
  );

  const handleDeassign = useCallback((meterId: string) => {
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[meterId];
      return next;
    });
    setOrder((prev) => prev.filter((id) => id !== meterId));
  }, []);

  const handleClear = () => {
    setAssignments({});
    setOrder([]);
  };

  const handleSave = async () => {
    try {
      await updateZone.mutateAsync({
        id: zoneId,
        route_order: order.length > 0 ? order : null,
        route_assignments: Object.keys(assignments).length > 0 ? assignments : null,
      });
      toast({ title: "Ruta guardada" });
    } catch {
      toast({ title: "Error al guardar ruta", variant: "destructive" });
    }
  };

  // Meters for a given operator, in global order
  const metersForOperator = useCallback(
    (operatorId: string) =>
      order
        .filter((id) => assignments[id] === operatorId)
        .map((id) => meters.find((m) => m.id === id))
        .filter((m): m is ReadingRouteItem => m !== undefined),
    [order, assignments, meters]
  );

  // Polyline path per operator
  const polylinePerOperator = useMemo(
    () =>
      operators.map((op) => ({
        op,
        path: order
          .filter((id) => assignments[id] === op.id)
          .map((id) => meters.find((m) => m.id === id))
          .filter(
            (m): m is ReadingRouteItem =>
              m !== undefined && m.lat != null && m.lng != null
          )
          .map((m) => ({ lat: m.lat!, lng: m.lng! })),
      })),
    [order, assignments, operators, meters]
  );

  const unassignedMeters = meters.filter((m) => !assignments[m.id]);

  if (loadError) {
    return <p className="text-sm text-destructive">Error al cargar el mapa.</p>;
  }

  if (!isLoaded) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        Cargando mapa...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Operator picker toolbar */}
      {operators.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium shrink-0">
            Pincel:
          </span>
          {operators.map((op, idx) => {
            const color = OPERATOR_COLORS[idx % OPERATOR_COLORS.length];
            const isActive = activeOperatorId === op.id;
            const count = Object.values(assignments).filter((v) => v === op.id).length;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => setActiveOperatorId(op.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 cursor-pointer ${
                  isActive ? "text-white shadow-sm" : "bg-white text-gray-700 hover:opacity-80"
                }`}
                style={
                  isActive
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: color }
                }
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: isActive ? "rgba(255,255,255,0.7)" : color }}
                />
                {op.name}
                {count > 0 && (
                  <span className={isActive ? "opacity-75" : "text-muted-foreground"}>
                    ({count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Map + Panel */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Map */}
        <div className="flex-1 rounded-lg overflow-hidden border">
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={center}
            onLoad={onMapLoad}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            <Polygon
              paths={polygon}
              options={{
                strokeColor: "#3b82f6",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#3b82f6",
                fillOpacity: 0.1,
              }}
            />

            {meters.map((m) => {
              if (m.lat == null || m.lng == null) return null;
              const operatorId = assignments[m.id];
              const color = operatorId
                ? (operatorColorMap[operatorId] ?? UNASSIGNED_COLOR)
                : UNASSIGNED_COLOR;
              const positionInOrder = order.indexOf(m.id);
              return (
                <Marker
                  key={m.id}
                  position={{ lat: m.lat, lng: m.lng }}
                  title={m.street_address ?? m.device_name}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: operatorId ? 11 : 8,
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                  label={
                    positionInOrder >= 0
                      ? {
                          text: String(positionInOrder + 1),
                          color: "white",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }
                      : undefined
                  }
                  onClick={() => handleMeterClick(m.id)}
                />
              );
            })}

            {polylinePerOperator.map(({ op, path }) =>
              path.length >= 2 ? (
                <Polyline
                  key={op.id}
                  path={path}
                  options={{
                    strokeColor: operatorColorMap[op.id],
                    strokeWeight: 3,
                    strokeOpacity: 0.85,
                  }}
                />
              ) : null
            )}
          </GoogleMap>
        </div>

        {/* Panel */}
        <div className="md:w-72 flex flex-col border rounded-lg overflow-hidden md:h-[400px] bg-muted/20">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
            <div className="flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold">Asignación</span>
            </div>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {order.length}/{meters.length}
            </Badge>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {operators.length === 0 ? (
              <div className="h-full flex items-center justify-center py-8">
                <p className="text-xs text-muted-foreground text-center px-2">
                  Sin operarios asignados a esta zona.
                </p>
              </div>
            ) : (
              <>
                {operators.map((op, idx) => {
                  const color = OPERATOR_COLORS[idx % OPERATOR_COLORS.length];
                  const opMeters = metersForOperator(op.id);
                  return (
                    <div key={op.id}>
                      {/* Operator header */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-semibold truncate">
                          {op.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs tabular-nums ml-auto shrink-0"
                        >
                          {opMeters.length}
                        </Badge>
                      </div>

                      {opMeters.length === 0 ? (
                        <p className="text-xs text-muted-foreground pl-4 pb-1 italic">
                          Sin medidores
                        </p>
                      ) : (
                        <ol className="space-y-1">
                          {opMeters.map((m) => (
                            <li
                              key={m.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background border hover:border-blue-200 transition-colors group cursor-default"
                            >
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: color }}
                              >
                                {order.indexOf(m.id) + 1}
                              </span>
                              <span className="flex-1 min-w-0 text-xs font-medium truncate">
                                {m.street_address ?? m.device_name}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                onClick={() => handleDeassign(m.id)}
                                title="Desasignar"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  );
                })}

                {/* Unassigned meters */}
                {unassignedMeters.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                      Sin asignar ({unassignedMeters.length})
                    </p>
                    <ul className="space-y-0.5">
                      {unassignedMeters.map((m) => (
                        <li
                          key={m.id}
                          className="text-xs text-muted-foreground px-2 py-1.5 rounded-md hover:bg-muted/60 hover:text-foreground cursor-pointer transition-colors"
                          onClick={() => handleMeterClick(m.id)}
                          title="Asignar al operario activo"
                        >
                          {m.street_address ?? m.device_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={handleClear}
          disabled={order.length === 0 && Object.keys(assignments).length === 0}
        >
          Limpiar
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateZone.isPending}
        >
          Guardar ruta
        </Button>
      </div>
    </div>
  );
}
