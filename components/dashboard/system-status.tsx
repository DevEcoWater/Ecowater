import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { chipConfig } from "@/utils/getChipColor";
import { MeterStatus } from "@prisma/client";

interface DeviceCardProps {
  status?: MeterStatus;
  signal?: boolean;
  valve_status?: "open" | "closed" | "abnormal" | "unkown";
  battery_voltage?: "normal" | "low";
  isLoading?: boolean; // 👈 new prop for skeleton state
}

export const statusMap: Record<
  NonNullable<DeviceCardProps["status"]>,
  { label: string; style: keyof typeof chipConfig }
> = {
  ACTIVE: { label: "Operativo", style: "ACTIVE" },
  FAULTY: { label: "Defectuoso", style: "FAULTY" },
  MAINTENANCE: { label: "Mantenimiento req.", style: "PENDING" },
  INACTIVE: { label: "Inactivo", style: "DEFAULT" },
};

const signalMap: Record<
  string,
  { label: string; style: keyof typeof chipConfig }
> = {
  true: { label: "Excelente", style: "ACTIVE" },
  false: { label: "Débil", style: "FAULTY" },
};

const valveMap: Record<
  NonNullable<DeviceCardProps["valve_status"]>,
  { label: string; style: keyof typeof chipConfig }
> = {
  open: { label: "Abierta", style: "ACTIVE" },
  closed: { label: "Cerrada", style: "FAULTY" },
  abnormal: { label: "Anómala", style: "PENDING" },
  unkown: { label: "Desconocida", style: "DEFAULT" },
};

const batteryMap: Record<
  NonNullable<DeviceCardProps["battery_voltage"]>,
  { label: string; style: keyof typeof chipConfig }
> = {
  normal: { label: "Normal", style: "ACTIVE" },
  low: { label: "Bajo", style: "FAULTY" },
};

const StatusItem = ({
  title,
  value,
  style,
  isLoading,
}: {
  title: string;
  value?: string;
  style?: keyof typeof chipConfig;
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="p-2 rounded flex flex-col justify-center items-center gap-1 w-full">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    );
  }

  const chip = style
    ? chipConfig[style] ?? chipConfig.DEFAULT
    : chipConfig.DEFAULT;
  return (
    <div
      className="p-2 rounded flex flex-col justify-center items-center gap-1 w-full"
      style={{ backgroundColor: chip.backgroundColor }}
    >
      <p className="text-sm">{title}</p>
      <p className="font-semibold" style={{ color: chip.textColor }}>
        {value ?? "Desconocido"}
      </p>
    </div>
  );
};

const DeviceCard: React.FC<DeviceCardProps> = ({
  status,
  signal,
  valve_status,
  battery_voltage,
  isLoading = false,
}) => {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <StatusItem
          title="Estado"
          value={status ? statusMap[status].label : undefined}
          style={status ? statusMap[status].style : undefined}
          isLoading={isLoading}
        />
        <StatusItem
          title="Señal"
          value={
            signal !== undefined ? signalMap[String(signal)].label : undefined
          }
          style={
            signal !== undefined ? signalMap[String(signal)].style : undefined
          }
          isLoading={isLoading}
        />
        <StatusItem
          title="Válvula"
          value={valve_status ? valveMap[valve_status].label : undefined}
          style={valve_status ? valveMap[valve_status].style : undefined}
          isLoading={isLoading}
        />
        <StatusItem
          title="Voltaje Batería"
          value={
            battery_voltage ? batteryMap[battery_voltage].label : undefined
          }
          style={
            battery_voltage ? batteryMap[battery_voltage].style : undefined
          }
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
};

export default DeviceCard;
