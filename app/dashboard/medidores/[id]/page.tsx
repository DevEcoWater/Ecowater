"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import {
  Clock,
  Droplets,
  ChartColumn,
  ThermometerSun,
  Activity,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Table,
  Download,
  Wifi,
  Battery,
  Gauge,
  Power,
  PowerOff,
} from "lucide-react";
import { MeterTypeChip } from "@/components/ui/meter-type-chip";
import MeterCard from "@/components/dashboard/meter-card";
import { Main } from "@/components/layout/panel/main";
import { useParams } from "next/navigation";
import { useMeterQuery } from "@/hooks/meters/use-meter-query";
import { formatDateTimeShortAR } from "@/lib/utils";
import AlertComponent from "@/components/medidores/detail/Alerts";
import DeviceCard from "@/components/dashboard/system-status";
import { useMeterReadings } from "@/hooks/readings/user-readings-";
import { ReadingTable } from "@/components/readings/reading-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSkeleton } from "@/components/medidores/detail/MeterDetailSkeleton";
import { UserButton } from "@/components/medidores/detail/UserButton";
import { Separator } from "@/components/ui/separator";
import { ConsumptionChart } from "@/components/dashboard/home/consumption-chart/consumption-chart";
import {
  useConsumptionFromMeterData,
  type DashboardPeriod,
  type ConsumptionQueryParams,
} from "@/hooks/dashboard/use-consumption-data";
import { DateRangeSelector } from "@/components/dashboard/home/date-range-selector";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { downloadReadingsCsv } from "@/lib/export-csv";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadInvoiceCsv } from "@/lib/export-invoice";
import { useSession } from "next-auth/react";
import { useFeaturePacks } from "@/hooks/cooperative/use-feature-packs";
import { useUpdateMeterStatusMutation } from "@/hooks/meters/use-meter-query";
import { useToast } from "@/hooks/use-toast";
import { ValveCommandsCard } from "@/components/medidores/detail/valve-commands-card";
import { resolveValveDisplayStatus } from "@/types/meters/valve-types";
import { useMeterZoneQuery } from "@/hooks/zones/use-zones";
import Link from "next/link";
import { Layers } from "lucide-react";

const MeterDashboard = () => {
  const { id } = useParams();

  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("30d");
  const [customRange, setCustomRange] = useState<{ startDate: string; endDate: string } | null>(null);

  const consumptionParams: ConsumptionQueryParams = customRange
    ? { startDate: customRange.startDate, endDate: customRange.endDate }
    : { period: selectedPeriod };

  const { data: session } = useSession();
  const canOperate = session?.user?.canWrite ?? false;

  const { data: packs } = useFeaturePacks();
  const { data: meterData, isLoading: isLoadingMeter } = useMeterQuery(
    id as string
  );
  const { data: meterZone } = useMeterZoneQuery(id as string);

  const { data: consumption, isLoading: consumptionLoading } =
    useConsumptionFromMeterData(id as string, consumptionParams);

  const previousConsumptionParams = getPreviousPeriodParams(selectedPeriod, customRange);
  const { data: previousConsumption } = useConsumptionFromMeterData(
    id as string,
    previousConsumptionParams
  );

  const {
    data: readingsData,
    isLoading: readingsLoading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    total,
  } = useMeterReadings(
    id as string,
    customRange ? undefined : selectedPeriod,
    customRange?.startDate,
    customRange?.endDate
  );

  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

  async function handleDownloadInvoice() {
    setIsDownloadingInvoice(true);
    try {
      await downloadInvoiceCsv({
        meterId: id as string,
        devEui: meterData.dev_eui ?? meterData.id.slice(-8),
        cumulativeFlow: meterData.reading?.cumulative_flow ? parseFloat(meterData.reading.cumulative_flow) : undefined,
        userId: meterData.user ?? null,
      });
    } finally {
      setIsDownloadingInvoice(false);
    }
  }

  async function handleDownloadCsv() {
    setIsDownloading(true);
    const meterId = id as string;
    const suffix = customRange
      ? `${customRange.startDate}_${customRange.endDate}`
      : selectedPeriod;
    try {
      await downloadReadingsCsv(
        meterId,
        customRange ?? { period: selectedPeriod },
        `lecturas-${meterId.slice(-8)}-${suffix}.csv`,
        {
          devEui: meterData?.dev_eui ?? meterId.slice(-8),
          userName: meterData?.userName ?? null,
          domicilio: meterData?.street_address ?? null,
          meterType: meterData?.meter_type ?? "SMART",
        }
      );
    } finally {
      setIsDownloading(false);
    }
  }
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    chart: true,
    status: true,
    alerts: true,
  });

  const isMechanical = meterData?.meter_type === "MECHANICAL";

  const { toast } = useToast();
  const statusMutation = useUpdateMeterStatusMutation();

  const isMeterActive = meterData?.status === "ACTIVE";
  const hasMeterUser = !!meterData?.user;

  const handleToggleMeterStatus = async () => {
    if (!meterData) return;
    const nextStatus = isMeterActive ? "INACTIVE" : "ACTIVE";
    try {
      await statusMutation.mutateAsync({ id: meterData.id, status: nextStatus });
      toast({ title: nextStatus === "ACTIVE" ? "Medidor activado" : "Medidor desactivado" });
    } catch (err: any) {
      toast({
        title: "No se pudo cambiar el estado",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const currentTotal = consumption
    ? consumption.series.reduce((sum, point) => sum + (point.consumo_m3 ?? 0), 0)
    : 0;
  const previousTotal = previousConsumption
    ? previousConsumption.series.reduce((sum, point) => sum + (point.consumo_m3 ?? 0), 0)
    : 0;
  const consumptionDelta =
    previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : null;
  const consumptionTrend =
    consumptionDelta !== null
      ? {
          value: Math.abs(consumptionDelta),
          direction: consumptionDelta >= 0 ? ("up" as const) : ("down" as const),
        }
      : undefined;

  type MetricItem = {
    title: string;
    value: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    status: string;
    trend?: { value: number; direction: "up" | "down" };
  };
  const metrics: MetricItem[] = isMechanical
    ? [
        {
          title: "Última Lectura",
          value: meterData?.reading?.instantaneous_flow != null
            ? `${meterData.reading.instantaneous_flow} m³`
            : "Sin lecturas",
          icon: Droplets,
          status: "default",
        },
        {
          title: "Consumo",
          value: meterData?.reading?.consumption != null
            ? `${meterData.reading.consumption} m³`
            : "—",
          icon: ChartColumn,
          status: "default",
          trend: consumptionTrend,
        },
      ]
    : [
    {
      title: "Flujo Acumulado",
      value: `${meterData?.reading?.cumulative_flow ?? "—"} m³`,
      icon: Droplets,
      status: "default",
    },
    {
      title: "Flujo Instantáneo",
      value: `${meterData?.reading?.instantaneous_flow ?? "—"} L/min`,
      icon: ChartColumn,
      status: "default",
    },
    {
      title: "Flujo Reverso",
      value: `${meterData?.reading?.reverse_flow ?? "—"} m³`,
      icon: Activity,
      status: "error",
    },
    {
      title: "Temperatura",
      value: `${meterData?.reading?.real_time_temperature ?? "—"}°C`,
      icon: ThermometerSun,
      status: "inactive",
    },
  ];

  if (isLoadingMeter || consumptionLoading) {
    return (
      <div>
        <DashboardSkeleton />
      </div>
    );
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Health strip derived values
  const connStatus = meterData.connectivity?.status ?? "OFFLINE";
  const connColorMap = {
    ONLINE: { bg: "#dcfce7", text: "#166534" },
    STALE: { bg: "#fef9c3", text: "#854d0e" },
    OFFLINE: { bg: "#f3f4f6", text: "#6b7280" },
  } as const;
  const connLabels = { ONLINE: "En línea", STALE: "Intermitente", OFFLINE: "Sin señal" };
  const connColors = connColorMap[connStatus as keyof typeof connColorMap] ?? connColorMap.OFFLINE;

  const valveRaw = meterData.reading?.statuses?.valve_status ?? null;
  const valveStatus = resolveValveDisplayStatus(valveRaw);
  const VALVE_STATUS_CONFIG = {
    OPEN: { label: "Abierta", className: "bg-green-100 text-green-800" },
    CLOSED: { label: "Cerrada", className: "bg-red-100 text-red-800" },
    ABNORMAL: { label: "Anormal", className: "bg-orange-100 text-orange-800" },
    UNKNOWN: { label: "Desconocido", className: "bg-gray-100 text-gray-600" },
  } as const;
  const valveStatusCfg = VALVE_STATUS_CONFIG[valveStatus];
  const batteryLevel = (meterData.reading?.statuses as any)?.battery as number | undefined;

  return (
    <>
      {/* ===== Content ===== */}
      <Main className="p-0">
        <div className="md:hidden sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="border shadow-sm rounded-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                {/* Left side */}
                <div className="flex gap-4 items-center">
                  <div className="text-left min-w-0">
                    <p className="text-lg font-medium truncate">
                      Medidor {meterData.id.slice(-8)}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      DEV_EUI: {meterData.dev_eui}
                    </p>
                  </div>
                  {meterData.user && (
                    <>
                      <Separator orientation="vertical" className="h-10" />
                      <div className="flex-shrink-0">
                        <UserButton userId={meterData.user} />
                      </div>
                    </>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1">
                  <Chip
                    showDot
                    status={
                      isMechanical
                        ? meterData.status
                        : meterData.reading?.statuses?.meter_status || "Desconocido"
                    }
                  />
                  <div className="flex items-center justify-end gap-1">
                    <Clock size={12} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      Última actualización:{" "}
                      {formatDateTimeShortAR(meterData.updated_at)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownloadInvoice}
                    disabled={isDownloadingInvoice}
                    className="gap-1.5 text-xs h-7"
                  >
                    <Download className="w-3 h-3" />
                    {isDownloadingInvoice ? "Generando..." : "Descargar Factura"}
                  </Button>

                  {/* Activate / Deactivate — mechanical meters only */}
                  {isMechanical && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleToggleMeterStatus}
                      disabled={
                        statusMutation.isPending ||
                        !canOperate ||
                        (!isMeterActive && !hasMeterUser)
                      }
                      title={!hasMeterUser && !isMeterActive ? "Asigná un usuario para activar" : undefined}
                      className="gap-1.5 text-xs h-7"
                    >
                      {isMeterActive ? (
                        <><PowerOff className="w-3 h-3" />Desactivar</>
                      ) : (
                        <><Power className="w-3 h-3" />Activar</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
            {expandedSections.metrics && (
              <CardContent className="hidden pt-0">
                <div className="hidden md:grid grid-cols-2 gap-3">
                  {metrics.map((metric, index) => (
                    <MeterCard
                      key={index}
                      title={metric.title}
                      value={metric.value}
                      icon={metric.icon}
                      status={meterData.status}
                      isLoading={false}
                      meterDetail={false}
                      trend={metric.trend}
                    />
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Mobile health strip — smart meters only */}
        {!isMechanical && (
          <div className="md:hidden flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/40 rounded-xl border text-sm">
            {/* Connectivity */}
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Señal:</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: connColors.bg, color: connColors.text }}
              >
                {connLabels[connStatus as keyof typeof connLabels]}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* Last seen */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última señal:</span>
              <span className="font-medium">
                {meterData.connectivity?.lastSeen
                  ? formatDateTimeShortAR(meterData.connectivity.lastSeen)
                  : "—"}
              </span>
            </div>

            {/* Battery — only if available */}
            {batteryLevel != null && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Batería:</span>
                  <span className="font-medium">{batteryLevel}%</span>
                </div>
              </>
            )}

            {/* Valve — only if available */}
            {meterData.reading?.statuses?.valve_status != null && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Válvula:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${valveStatusCfg.className}`}>
                    {valveStatusCfg.label}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Desktop */}
        <Card id="tour-meter-header" className="hidden md:block">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: identity */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold leading-tight">
                      {meterData.device_name || `Medidor ${meterData.id.slice(-8)}`}
                    </p>
                    <MeterTypeChip type={meterData.meter_type} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {meterData.meter_type === "MECHANICAL"
                      ? meterData.street_address ?? "Sin dirección"
                      : meterData.dev_eui}
                  </p>
                </div>

                {meterData.user && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    <UserButton userId={meterData.user} />
                  </>
                )}

                {meterZone && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    <Link
                      href={`/dashboard/zonas/${meterZone.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meterZone.color }}
                      />
                      <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                      {meterZone.name}
                    </Link>
                  </>
                )}
              </div>

              {/* Right: status + actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{formatDateTimeShortAR(meterData.updated_at)}</span>
                </div>

                <Separator orientation="vertical" className="h-5" />

                <Chip
                  showDot
                  status={
                    isMechanical
                      ? meterData.status
                      : meterData.connectivity?.status === "ONLINE"
                      ? "ACTIVE"
                      : meterData.connectivity?.status === "STALE"
                      ? "INACTIVE"
                      : meterData.connectivity?.status === "OFFLINE"
                      ? "INACTIVE"
                      : "Desconocido"
                  }
                />

                <Separator orientation="vertical" className="h-5" />

                {/* Activate / Deactivate — mechanical meters only */}
                {isMechanical && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleToggleMeterStatus}
                      disabled={
                        statusMutation.isPending ||
                        !canOperate ||
                        (!isMeterActive && !hasMeterUser)
                      }
                      title={!hasMeterUser && !isMeterActive ? "Asigná un usuario para activar" : undefined}
                      className="gap-1.5"
                    >
                      {isMeterActive ? (
                        <><PowerOff className="w-4 h-4" />Desactivar</>
                      ) : (
                        <><Power className="w-4 h-4" />Activar</>
                      )}
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloadingInvoice}
                  className="gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingInvoice ? "Generando..." : "Descargar Factura"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Desktop health strip — smart meters only */}
        {!isMechanical && (
          <div className="hidden md:flex flex-wrap items-center gap-3 px-4 py-3 bg-muted/40 rounded-xl border text-sm">
            {/* Connectivity */}
            <div className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Señal:</span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: connColors.bg, color: connColors.text }}
              >
                {connLabels[connStatus as keyof typeof connLabels]}
              </span>
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* Last seen */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Última señal:</span>
              <span className="font-medium">
                {meterData.connectivity?.lastSeen
                  ? formatDateTimeShortAR(meterData.connectivity.lastSeen)
                  : "—"}
              </span>
            </div>

            {/* Battery — only if available */}
            {batteryLevel != null && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Batería:</span>
                  <span className="font-medium">{batteryLevel}%</span>
                </div>
              </>
            )}

            {/* Valve — only if available */}
            {meterData.reading?.statuses?.valve_status != null && (
              <>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Válvula:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${valveStatusCfg.className}`}>
                    {valveStatusCfg.label}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <div className="md:hidden space-y-4 py-4">
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
                      trend={metric.trend}
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
                <div className="mb-4">
                  <DateRangeSelector
                    selectedPeriod={selectedPeriod}
                    customRange={customRange}
                    onPeriodSelect={(p) => { setSelectedPeriod(p); setCustomRange(null); }}
                    onRangeApply={(start, end) => setCustomRange({ startDate: start, endDate: end })}
                    onRangeClear={() => setCustomRange(null)}
                  />
                </div>

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
                    <ConsumptionChart
                      data={consumption}
                      meterStatus={meterData.status || "Desconocido"}
                    />
                  </TabsContent>

                  <TabsContent value="table" className="mt-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Filas:</span>
                        <Select
                          value={String(limit)}
                          onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
                        >
                          <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" onClick={handleDownloadCsv} disabled={isDownloading} className="gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" />
                        {isDownloading ? "Descargando..." : "Exportar CSV"}
                      </Button>
                    </div>
                    <div className="min-h-[21rem] overflow-y-auto">
                      <ReadingTable
                        data={readingsData}
                        isLoading={readingsLoading}
                        error={null}
                        meterType={meterData?.meter_type}
                      />
                    </div>
                    <TablePagination
                      page={page}
                      setPage={setPage}
                      totalPages={totalPages}
                      total={total}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            )}
          </Card>

          {/* Device Status Section — only for smart meters */}
          {!isMechanical && (
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
                    meterData.reading?.statuses?.valve_status as
                      | "open"
                      | "closed"
                      | "abnormal"
                      | "unkown"
                      | undefined
                  }
                  battery_voltage={
                    meterData.reading?.statuses?.battery_voltage as
                      | "normal"
                      | "low"
                      | undefined
                  }
                />
              </CardContent>
            )}
          </Card>
          )}

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
                <AlertComponent meterId={meterData.id} meterType={meterData.meter_type} />
              </CardContent>
            )}
          </Card>
        </div>

        <div className="hidden md:block py-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content Area - Left Side */}
            <div className="col-span-8 space-y-6">
              {/* Metrics Cards */}
              <div id="tour-meter-metrics" className="grid grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                  <MeterCard
                    key={index}
                    title={metric.title}
                    value={metric.value}
                    icon={metric.icon}
                    status={meterData.status}
                    isLoading={false}
                    meterDetail={false}
                    trend={metric.trend}
                  />
                ))}
              </div>

              {/* Chart/Table Section */}
              <Card id="tour-meter-chart">
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
                    <div className="mb-4">
                      <DateRangeSelector
                        selectedPeriod={selectedPeriod}
                        customRange={customRange}
                        onPeriodSelect={(p) => { setSelectedPeriod(p); setCustomRange(null); }}
                        onRangeApply={(start, end) => setCustomRange({ startDate: start, endDate: end })}
                        onRangeClear={() => setCustomRange(null)}
                      />
                    </div>

                    <TabsContent value="graph" className="mt-0">
                      <div className="h-full">
                        <ConsumptionChart
                          data={consumption}
                          meterStatus={meterData.status || "Desconocido"}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="table" className="mt-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Filas:</span>
                          <Select
                            value={String(limit)}
                            onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
                          >
                            <SelectTrigger className="h-8 w-[70px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10</SelectItem>
                              <SelectItem value="25">25</SelectItem>
                              <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleDownloadCsv} disabled={isDownloading} className="gap-1.5 text-xs">
                          <Download className="w-3.5 h-3.5" />
                          {isDownloading ? "Descargando..." : "Exportar CSV"}
                        </Button>
                      </div>
                      <div className="min-h-[21rem] overflow-y-auto">
                        <ReadingTable
                          data={readingsData}
                          isLoading={readingsLoading}
                          error={null}
                          meterType={meterData?.meter_type}
                        />
                      </div>
                      <TablePagination
                        page={page}
                        setPage={setPage}
                        totalPages={totalPages}
                        total={total}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Right Side */}
            <div className="col-span-4 space-y-6">
              {/* Device Status — only for smart meters */}
              {!isMechanical && (
              <Card id="tour-meter-status">
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
                      meterData.reading?.statuses?.valve_status as
                        | "open"
                        | "closed"
                        | "abnormal"
                        | "unkown"
                        | undefined
                    }
                    battery_voltage={
                      meterData.reading?.statuses?.battery_voltage as
                        | "normal"
                        | "low"
                        | undefined
                    }
                  />
                </CardContent>
              </Card>
              )}

              {/* Alerts */}
              <Card id="tour-meter-alerts">
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Urgencias detectadas
                  </h2>
                </CardHeader>
                <CardContent>
                  <AlertComponent meterId={meterData.id} meterType={meterData.meter_type} />
                </CardContent>
              </Card>

            </div>

            {/* Valve control — full width row, smart meters only */}
            {packs?.valve_control && !isMechanical && (
              <div className="col-span-12">
                <ValveCommandsCard
                  meterId={meterData.id}
                  deviceName={meterData.device_name}
                  currentValveStatus={meterData.reading?.statuses?.valve_status ?? null}
                  lastSeen={meterData.connectivity?.lastSeen ?? null}
                  canOperate={canOperate}
                />
              </div>
            )}
          </div>
        </div>
      </Main>
    </>
  );
};

export default MeterDashboard;

function getPreviousPeriodParams(
  period: DashboardPeriod,
  customRange: { startDate: string; endDate: string } | null
): ConsumptionQueryParams {
  if (customRange) {
    const start = dayjs(customRange.startDate);
    const end = dayjs(customRange.endDate);
    const duration = end.diff(start, "day");
    return {
      startDate: start.subtract(duration, "day").format("YYYY-MM-DD"),
      endDate: start.subtract(1, "day").format("YYYY-MM-DD"),
    };
  }
  const periodMap: Record<DashboardPeriod, { value: number; unit: "day" | "month" | "year" }> = {
    "7d": { value: 7, unit: "day" },
    "30d": { value: 30, unit: "day" },
    "90d": { value: 90, unit: "day" },
    "6m": { value: 6, unit: "month" },
    "1y": { value: 1, unit: "year" },
  };
  const { value, unit } = periodMap[period];
  return {
    startDate: dayjs()
      .subtract(value * 2, unit)
      .format("YYYY-MM-DD"),
    endDate: dayjs()
      .subtract(value, unit)
      .format("YYYY-MM-DD"),
  };
}

function getPaginationRange(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (page <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
  if (page >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "…", page - 1, page, page + 1, "…", totalPages];
}

function TablePagination({
  page,
  setPage,
  totalPages,
  total,
}: {
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;
  const range = getPaginationRange(page, totalPages);
  return (
    <div className="flex flex-col items-center gap-1 mt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }}
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {range.map((item, i) =>
            item === "…" ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e) => { e.preventDefault(); setPage(item as number); }}
                >
                  {item}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }}
              aria-disabled={page === totalPages}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-xs text-muted-foreground">{total} registros en total</p>
    </div>
  );
}
