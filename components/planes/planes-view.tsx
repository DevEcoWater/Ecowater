"use client";

import { Check, Droplets, Gauge, Layers, Minus, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturePacks } from "@/hooks/cooperative/use-feature-packs";

// Lo que toda instalacion incluye. Solo el control de valvulas se activa o se
// apaga por cliente (FEATURE_VALVE_CONTROL); los otros flags de packs todavia
// no gobiernan nada en la interfaz y por eso no se listan como modulos.
const BASE_MODULES = [
  {
    icon: Gauge,
    title: "Medidores inteligentes y mecánicos",
    text: "Lecturas automáticas por LoRa y carga manual de lecturas por los operarios de campo.",
  },
  {
    icon: Layers,
    title: "Mapa, zonas y rutas de lectura",
    text: "Ubicación de cada medidor, zonas de trabajo y asignación de operarios.",
  },
  {
    icon: Droplets,
    title: "Consumo y urgencias",
    text: "Consumo por período, ranking por medidor y por zona, y alertas de los medidores que necesitan atención.",
  },
];

export function PlanesView() {
  const { data: packs, isLoading } = useFeaturePacks();

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-lg font-semibold">Incluido en tu plataforma</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BASE_MODULES.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold leading-tight">{title}</h3>
                </div>
                <Badge variant="secondary" className="shrink-0 gap-1">
                  <Check className="h-3 w-3" /> Incluido
                </Badge>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Módulos opcionales</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold leading-tight">Control de válvulas</h3>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : packs?.valve_control ? (
                <Badge className="shrink-0 gap-1 bg-green-600 hover:bg-green-600">
                  <Check className="h-3 w-3" /> Activo
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 gap-1">
                  <Minus className="h-3 w-3" /> No activo
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Abrir y cerrar la válvula de los medidores inteligentes que la tengan instalada, con
                registro de quién dio cada orden.
              </p>
              <p>El medidor ejecuta la orden en su próximo reporte.</p>
              {!isLoading && !packs?.valve_control && (
                <p>Consultá con Ecowater para activarlo en tu cooperativa.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
