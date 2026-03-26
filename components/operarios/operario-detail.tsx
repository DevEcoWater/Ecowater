"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Layers,
  Mail,
  UserCheck,
  ClipboardList,
  CalendarDays,
  Activity,
  Clock,
  MapPin,
} from "lucide-react";
import { useOperarioQuery, useOperarioReadingsQuery } from "@/hooks/operarios/use-operarios";
import ZoneAssignment from "./zone-assignment";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/es";

dayjs.extend(relativeTime);
dayjs.locale("es");

interface OperarioDetailProps {
  id: string;
}

const ZONE_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activa",
  UPCOMING: "Próxima",
  INACTIVE: "Inactiva",
};

const ZONE_STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  UPCOMING: "bg-yellow-100 text-yellow-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

export default function OperarioDetail({ id }: OperarioDetailProps) {
  const { data, isLoading } = useOperarioQuery(id);
  const { data: readings = [], isLoading: readingsLoading } = useOperarioReadingsQuery(id);

  if (isLoading) {
    return <div className="py-8 text-center text-muted-foreground">Cargando...</div>;
  }

  if (!data) {
    return <div className="py-8 text-center text-muted-foreground">Operario no encontrado</div>;
  }

  const initials = `${data.firstName?.[0] ?? ""}${data.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold flex-shrink-0">
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold">
                  {data.firstName} {data.lastName}
                </h2>
                <Badge variant={data.status === "ACTIVE" ? "default" : "secondary"}>
                  <UserCheck className="h-3 w-3 mr-1" />
                  {data.status === "ACTIVE" ? "Activo" : "Inactivo"}
                </Badge>
                <Badge variant="outline">Operario</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <Mail className="h-3.5 w-3.5" />
                {data.email}
              </div>
              {data.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Miembro desde {dayjs(data.created_at).format("MMMM YYYY")}
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Stats row */}
          <div id="tour-operario-stats" className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{data.readings_total ?? 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <ClipboardList className="h-3 w-3" />
                Lecturas totales
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.readings_this_week ?? 0}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Activity className="h-3 w-3" />
                Esta semana
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.assignedZones.length}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                <Layers className="h-3 w-3" />
                Zonas asignadas
              </p>
            </div>
          </div>

          {data.last_reading_at && (
            <p className="text-xs text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              Última lectura {dayjs(data.last_reading_at).fromNow()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Zones */}
      <Card id="tour-operario-zones">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Zonas Asignadas
          </CardTitle>
          <CardDescription>
            Las zonas donde este operario realizará la lectura de medidores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignedZones.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {data.assignedZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: zone.color }}
                  />
                  <span className="text-sm font-medium flex-1 truncate">{zone.name}</span>
                  {zone.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ZONE_STATUS_CLASS[zone.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {ZONE_STATUS_LABEL[zone.status] ?? zone.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <ZoneAssignment operarioId={id} assignedZones={data.assignedZones} />
        </CardContent>
      </Card>

      {/* Reading history */}
      <Card id="tour-operario-readings">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Historial de Lecturas
          </CardTitle>
          <CardDescription>Últimas 30 lecturas registradas por este operario.</CardDescription>
        </CardHeader>
        <CardContent>
          {readingsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando historial...</p>
          ) : readings.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Este operario aún no ha registrado lecturas.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground text-xs">
                    <th className="text-left py-2 pr-4 font-medium">Medidor</th>
                    <th className="text-left py-2 pr-4 font-medium">Lectura (m³)</th>
                    <th className="text-left py-2 pr-4 font-medium">Consumo (m³)</th>
                    <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                    <th className="text-left py-2 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium leading-tight">{r.meter_name ?? r.meter_id.slice(-8)}</p>
                            {r.meter_address && (
                              <p className="text-xs text-muted-foreground">{r.meter_address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {r.instantaneous_flow ?? "—"}
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {r.consumption != null ? r.consumption.toFixed(2) : "—"}
                      </td>
                      <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">
                        {dayjs(r.timestamp).format("DD/MM/YY HH:mm")}
                      </td>
                      <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">
                        {r.observations ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
