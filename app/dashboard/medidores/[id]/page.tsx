"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import {
  Clock,
  Database,
  Droplets,
  ChartColumn,
  ThermometerSun,
  Activity,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Table,
} from "lucide-react";
import MeterCard from "@/components/dashboard/meter-card";
import { Main } from "@/components/layout/panel/main";
import { useParams } from "next/navigation";
import { useMeterQuery } from "@/hooks/meters/use-meter-query";
import dayjs from "dayjs";
import AlertComponent from "@/components/medidores/detail/Alerts";
import DeviceCard from "@/components/dashboard/system-status";
import { useMeterReadings } from "@/hooks/readings/user-readings-";
import { ChartAreaInteractive } from "@/components/area-chart";
import { ReadingTable } from "@/components/readings/reading-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { read } from "fs";

const MeterDashboard = () => {
  const { id } = useParams();

  const { data: meterData, isLoading: isLoadingMeter } = useMeterQuery(
    id as string
  );
  const { data: readingsData } = useMeterReadings(id as string);

  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    chart: true,
    status: true,
    alerts: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const metrics = [
    {
      title: "Flujo Acumulado",
      value: `${meterData && meterData.reading.cumulative_flow}`,
      icon: Droplets,
      status: "default",
    },
    {
      title: "Flujo Instantáneo",
      value: `${meterData && meterData.reading.instantaneous_flow}`,
      icon: ChartColumn,
      status: "default",
    },
    {
      title: "Flujo Reverso",
      value: `${meterData && meterData.reading.reverse_flow}`,
      icon: Activity,
      status: "error",
    },
    {
      title: "Temperatura",
      value: `${meterData && meterData.reading.real_time_temperature}`,
      icon: ThermometerSun,
      status: "inactive",
    },
  ];

  if (isLoadingMeter) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* ===== Content ===== */}
      <Main className="p-0">
        <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="p-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Database
                    className="p-2 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0"
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold truncate">
                      Medidor {meterData.id.slice(-8)}
                    </h1>
                    <p className="text-sm text-muted-foreground truncate">
                      DEV_EUI: {meterData.dev_eui}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock size={14} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Última actualización: 25/08/2025 16:06
                      </p>
                    </div>
                  </div>
                  <Chip showDot status={meterData.status} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden md:block border-b bg-background">
          <div className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left">
                <p className="text-lg font-medium">
                  Medidor {meterData.id.slice(-8)}
                </p>
                <p className="text-sm text-muted-foreground">
                  DEV_EUI: {meterData.dev_eui}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <Chip showDot status={meterData.status} />
                <div className="flex items-center justify-end gap-1 mt-1">
                  <Clock size={12} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Última actualización: 25/08/2025 16:06
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 space-y-4">
          {/* Collapsible Metrics Section */}
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection("metrics")}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Métricas Principales</h2>
                {expandedSections.metrics ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </CardHeader>
            {expandedSections.metrics && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  {metrics.map((metric, index) => (
                    <MeterCard
                      key={index}
                      title={metric.title}
                      value={metric.value}
                      icon={metric.icon}
                      status={meterData.status}
                      isLoading={false}
                      meterDetail={false}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Chart/Table Section with Tabs */}
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection("chart")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Consumo de Agua</h2>
                  <p className="text-sm text-muted-foreground">
                    Histórico de lecturas
                  </p>
                </div>
                {expandedSections.chart ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </CardHeader>
            {expandedSections.chart && (
              <CardContent className="pt-0">
                <Tabs
                  value={viewMode}
                  onValueChange={(value) =>
                    setViewMode(value as "graph" | "table")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger
                      value="graph"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 size={16} />
                      <span className="hidden sm:inline">Gráfico</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="table"
                      className="flex items-center gap-2"
                    >
                      <Table size={16} />
                      <span className="hidden sm:inline">Tabla</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="graph" className="mt-0">
                    <ChartAreaInteractive data={readingsData || []} />
                  </TabsContent>

                  <TabsContent value="table" className="mt-0">
                    <div className="overflow-x-auto">
                      <ReadingTable
                        data={readingsData}
                        isLoading={false}
                        error={null}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>

          {/* Device Status Section */}
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection("status")}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Estado del Dispositivo
                </h2>
                {expandedSections.status ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </CardHeader>
            {expandedSections.status && (
              <CardContent className="pt-0">
                <DeviceCard
                  status={meterData.status}
                  signal={true}
                  valve_status={
                    meterData.reading.statuses.valve_status as
                      | "open"
                      | "closed"
                      | "abnormal"
                      | "unkown"
                  }
                  battery_voltage={
                    meterData.reading.statuses.battery_voltage as
                      | "normal"
                      | "low"
                  }
                />
              </CardContent>
            )}
          </Card>

          {/* Alerts Section */}
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer"
              onClick={() => toggleSection("alerts")}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Alertas</h2>
                {expandedSections.alerts ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </div>
            </CardHeader>
            {expandedSections.alerts && (
              <CardContent className="pt-0">
                <AlertComponent readingData={meterData.reading} />
              </CardContent>
            )}
          </Card>
        </div>

        <div className="hidden md:block p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content Area - Left Side */}
            <div className="col-span-8 space-y-6">
              {/* Metrics Cards */}
              <div className="grid grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                  <MeterCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    status={meterData.status}
                    isLoading={false}
                    meterDetail={false}
                  />
                ))}
              </div>

              {/* Chart/Table Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Consumo de Agua</h2>
                      <p className="text-sm text-muted-foreground">
                        Histórico de lecturas
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs
                    value={viewMode}
                    onValueChange={(value) =>
                      setViewMode(value as "graph" | "table")
                    }
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger
                        value="graph"
                        className="flex items-center gap-2"
                      >
                        <BarChart3 size={16} />
                        Gráfico
                      </TabsTrigger>
                      <TabsTrigger
                        value="table"
                        className="flex items-center gap-2"
                      >
                        <Table size={16} />
                        Tabla
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="graph" className="mt-0">
                      <div className="h-[400px]">
                        <ChartAreaInteractive data={readingsData || []} />
                      </div>
                    </TabsContent>

                    <TabsContent value="table" className="mt-0">
                      <ReadingTable
                        data={readingsData}
                        isLoading={false}
                        error={null}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Side */}
            <div className="col-span-4 space-y-6">
              {/* Device Status */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Estado del Dispositivo
                  </h2>
                </CardHeader>
                <CardContent>
                  <DeviceCard
                    status={meterData.status}
                    signal={true}
                    valve_status={
                      meterData.reading.statuses.valve_status as
                        | "open"
                        | "closed"
                        | "abnormal"
                        | "unkown"
                    }
                    battery_voltage={
                      meterData.reading.statuses.battery_voltage as
                        | "normal"
                        | "low"
                    }
                  />
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Urgencias detectadas
                  </h2>
                </CardHeader>
                <CardContent>
                  <AlertComponent readingData={meterData.reading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
};

export default MeterDashboard;
