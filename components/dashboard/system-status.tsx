import React from "react";
import { Card } from "@/components/ui/card";
import { chipConfig } from "@/utils/getChipColor";
import { MeterStatus } from "@prisma/client";

interface DeviceCardProps {
  status: MeterStatus;
  signal: boolean;
  valve_status: "open" | "closed" | "abnormal" | "unkown";
  battery_voltage: "normal" | "low";
}

export const statusMap: Record<
  DeviceCardProps["status"],
  { label: string; style: keyof typeof chipConfig }
> = {
  ACTIVE: { label: "Operativo", style: "ACTIVE" },
  FAULTY: { label: "Defectuoso", style: "FAULTY" },
  MAINTENANCE: { label: "En revisión", style: "PENDING" },
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
  DeviceCardProps["valve_status"],
  { label: string; style: keyof typeof chipConfig }
> = {
  open: { label: "Abierta", style: "ACTIVE" },
  closed: { label: "Cerrada", style: "FAULTY" },
  abnormal: { label: "Anómala", style: "PENDING" },
  unkown: { label: "Desconocida", style: "DEFAULT" },
};

const batteryMap: Record<
  DeviceCardProps["battery_voltage"],
  { label: string; style: keyof typeof chipConfig }
> = {
  normal: { label: "Normal", style: "ACTIVE" },
  low: { label: "Bajo", style: "FAULTY" },
};

const StatusItem = ({
  title,
  value,
  style,
}: {
  title: string;
  value: string;
  style: keyof typeof chipConfig;
}) => {
  const chip = chipConfig[style] ?? chipConfig.DEFAULT;
  return (
    <div
      className="p-2 rounded flex flex-col justify-center items-center gap-1 w-full"
      style={{ backgroundColor: chip.backgroundColor }}
    >
      <p className="text-sm">{title}</p>
      <p className="font-semibold" style={{ color: chip.textColor }}>
        {value}
      </p>
    </div>
  );
};

const DeviceCard: React.FC<DeviceCardProps> = ({
  status,
  signal,
  valve_status,
  battery_voltage,
}) => {
  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="grid grid-cols-2 gap-4">
        <StatusItem
          title="Estado"
          value={statusMap[status].label}
          style={statusMap[status].style}
        />
        <StatusItem
          title="Señal"
          value={signalMap[String(signal)].label}
          style={signalMap[String(signal)].style}
        />
        <StatusItem
          title="Válvula"
          value={valveMap[valve_status].label}
          style={valveMap[valve_status].style}
        />
        <StatusItem
          title="Voltaje Batería"
          value={batteryMap[battery_voltage].label}
          style={batteryMap[battery_voltage].style}
        />
      </div>
    </Card>
  );
};

export default DeviceCard;
