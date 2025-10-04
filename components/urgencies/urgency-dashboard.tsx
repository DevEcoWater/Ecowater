"use client";

import {
  useDashboardUrgencies,
  useCriticalUrgencies,
} from "@/hooks/urgencies/use-urgencies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Battery,
  Droplets,
  Thermometer,
  Wrench,
} from "lucide-react";

export function UrgencyDashboard() {
  const { data: dashboardUrgencies, isLoading: dashboardLoading } =
    useDashboardUrgencies();
  const { data: criticalUrgencies, isLoading: criticalLoading } =
    useCriticalUrgencies();

  if (dashboardLoading || criticalLoading) {
    return <div>Cargando urgencias...</div>;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "destructive";
      case "HIGH":
        return "destructive";
      case "MEDIUM":
        return "default";
      case "LOW":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "CRITICAL_METER":
        return <AlertTriangle className="h-4 w-4" />;
      case "BATTERY_LOW":
        return <Battery className="h-4 w-4" />;
      case "EMPTY_PIPE_ALARM":
      case "REVERSE_FLOW_ALARM":
        return <Droplets className="h-4 w-4" />;
      case "WATER_TEMP_ALARM":
        return <Thermometer className="h-4 w-4" />;
      case "MAINTENANCE_NEEDED":
        return <Wrench className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "EXCELLENT":
        return "text-green-600";
      case "GOOD":
        return "text-blue-600";
      case "ATTENTION":
        return "text-yellow-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Estado del Sistema
            <Badge
              variant={getSeverityColor(
                dashboardUrgencies?.systemHealth || "EXCELLENT"
              )}
              className={getSystemHealthColor(
                dashboardUrgencies?.systemHealth || "EXCELLENT"
              )}>
              {dashboardUrgencies?.systemHealth || "EXCELLENT"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {dashboardUrgencies?.meta.criticalCount || 0}
              </div>
              <div className="text-sm text-gray-600">Críticas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardUrgencies?.meta.highCount || 0}
              </div>
              <div className="text-sm text-gray-600">Altas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {dashboardUrgencies?.meta.mediumCount || 0}
              </div>
              <div className="text-sm text-gray-600">Medias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {dashboardUrgencies?.meta.inactiveCount || 0}
              </div>
              <div className="text-sm text-gray-600">Inactivos</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Críticas */}
      {criticalUrgencies && criticalUrgencies.alerts.critical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticas ({criticalUrgencies.alerts.critical.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalUrgencies.alerts.critical.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="font-medium text-red-800">
                      {alert.message}
                    </div>
                    <div className="text-sm text-red-600">
                      Campo: {alert.field} | Valor:{" "}
                      {JSON.stringify(alert.value)}
                    </div>
                  </div>
                  <Badge variant="destructive">{alert.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Altas */}
      {dashboardUrgencies && dashboardUrgencies.alerts.high.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Altas ({dashboardUrgencies.alerts.high.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardUrgencies.alerts.high.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <div className="font-medium text-orange-800">
                      {alert.message}
                    </div>
                    <div className="text-sm text-orange-600">
                      Campo: {alert.field} | Valor:{" "}
                      {JSON.stringify(alert.value)}
                    </div>
                  </div>
                  <Badge variant="default">{alert.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medidores Inactivos */}
      {dashboardUrgencies && dashboardUrgencies.alerts.inactive.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Medidores Inactivos ({dashboardUrgencies.alerts.inactive.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardUrgencies.alerts.inactive.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {alert.message}
                    </div>
                    <div className="text-sm text-gray-600">
                      Medidor: {alert.meter?.device_name || "Sin nombre"}
                    </div>
                    {alert.user && (
                      <div className="text-sm text-gray-500">
                        Usuario: {alert.user.name} | {alert.user.address}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary">INACTIVO</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sin Alertas */}
      {dashboardUrgencies &&
        dashboardUrgencies.alerts.critical.length === 0 &&
        dashboardUrgencies.alerts.high.length === 0 &&
        dashboardUrgencies.alerts.medium.length === 0 &&
        dashboardUrgencies.alerts.inactive.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-green-600 text-lg font-medium">
                ✅ Sistema funcionando correctamente
              </div>
              <div className="text-gray-600 mt-2">
                No hay alertas activas en este momento
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
