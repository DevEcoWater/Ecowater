import { chipConfig } from "@/utils/getChipColor";
import React from "react";

interface SystemStatusProps {
  type: "system" | "signal";
  status: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ type, status }) => {
  const chip = type === "system" ? chipConfig["active"] : chipConfig["default"];

  return (
    <div
      className={`p-2 rounded flex flex-col justify-center items-center gap-1`}
      style={{ backgroundColor: chip.backgroundColor }}
    >
      <p>{type === "system" ? "Estado" : "Señal"}</p>
      <p className="font-semibold" style={{ color: chip.textColor }}>
        {status}
      </p>
    </div>
  );
};

export default SystemStatus;
