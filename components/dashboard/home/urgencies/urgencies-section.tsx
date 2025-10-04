"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UrgencyTabs } from "./urgency-tabs";
import { UrgencyCard } from "./urgency-card";
import { UrgencyResponse } from "@/hooks/urgencies/use-urgencies";
import { useDashboardUrgencies } from "@/hooks/urgencies/use-urgencies";
import { AlertTriangle, X } from "lucide-react";

interface UrgenciesSectionProps {
  urgencies?: UrgencyResponse;
}

type UrgencyFilter = "all" | "alerts" | "errors";

export function UrgenciesSection({
  urgencies: propUrgencies,
}: UrgenciesSectionProps) {
  const [activeFilter, setActiveFilter] = useState<UrgencyFilter>("all");
  const [isExpanded, setIsExpanded] = useState(true);

  // Usar hook interno si no se pasan urgencias como prop
  const { data: hookUrgencies, isLoading, error } = useDashboardUrgencies();
  const urgencies = propUrgencies || hookUrgencies;

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">
              Cargando urgencias...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !urgencies) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-600">
              Error al cargar urgencias
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFilteredUrgencies = () => {
    switch (activeFilter) {
      case "alerts":
        return [
          ...urgencies.alerts.medium,
          ...urgencies.alerts.low,
          ...urgencies.alerts.inactive,
        ];
      case "errors":
        return [...urgencies.alerts.critical, ...urgencies.alerts.high];
      default:
        return [
          ...urgencies.alerts.critical,
          ...urgencies.alerts.high,
          ...urgencies.alerts.medium,
          ...urgencies.alerts.low,
          ...urgencies.alerts.inactive,
        ];
    }
  };

  const filteredUrgencies = getFilteredUrgencies();

  if (!isExpanded) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">
                Urgencias ({urgencies.meta.total})
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Ver
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm bg-white h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Urgencias detectadas
          </CardTitle>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs de filtro */}
        <UrgencyTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={{
            all: urgencies.meta.total,
            alerts:
              urgencies.meta.mediumCount +
              urgencies.meta.lowCount +
              urgencies.meta.inactiveCount,
            errors: urgencies.meta.criticalCount + urgencies.meta.highCount,
          }}
        />

        {/* Lista de urgencias */}
        <div className="space-y-4 max-h-80 overflow-y-auto p-1 flex flex-col gap-1">
          {filteredUrgencies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No hay urgencias para mostrar</p>
            </div>
          ) : (
            filteredUrgencies
              .slice(0, 10)
              .map((urgency, index) => (
                <UrgencyCard
                  key={`${urgency.type}-${index}`}
                  urgency={urgency}
                />
              ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
