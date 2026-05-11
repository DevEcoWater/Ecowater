"use client";

import { ValveControlPanel } from "@/components/meters/valve-control-panel";

interface ValveCommandsCardProps {
  meterId: string;
  deviceName: string;
  currentValveStatus: string | null;
}

export function ValveCommandsCard({
  meterId,
  deviceName,
  currentValveStatus,
}: ValveCommandsCardProps) {
  return (
    <ValveControlPanel
      meterId={meterId}
      deviceName={deviceName}
      currentValveStatus={currentValveStatus}
    />
  );
}
