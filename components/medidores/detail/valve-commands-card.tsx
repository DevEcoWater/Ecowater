"use client";

import { ValveControlPanel } from "@/components/meters/valve-control-panel";

interface ValveCommandsCardProps {
  meterId: string;
  deviceName: string;
  currentValveStatus: string | null;
  lastSeen?: string | null;
  canOperate?: boolean;
}

export function ValveCommandsCard({
  meterId,
  deviceName,
  currentValveStatus,
  lastSeen,
  canOperate,
}: ValveCommandsCardProps) {
  return (
    <ValveControlPanel
      meterId={meterId}
      deviceName={deviceName}
      currentValveStatus={currentValveStatus}
      lastSeen={lastSeen}
      canOperate={canOperate}
    />
  );
}
