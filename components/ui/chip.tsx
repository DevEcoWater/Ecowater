import { chipConfig } from "@/utils/getChipColor";
import { parseMeterStatus } from "@/utils/parseMeterStatus";
import { parseChipStatus } from "@/utils/parseUserStatus";
import { MeterStatus, UserStatus } from "@prisma/client";
import type React from "react";
import { CSSProperties } from "react";

type Props = {
  status: MeterStatus | UserStatus;
  showDot?: boolean;
  style?: CSSProperties;
};

export type ChipStatus = MeterStatus | UserStatus;

const Chip: React.FC<Props> = ({ status, showDot = false, style }) => {
  const statusToStyleMap: Record<ChipStatus, keyof typeof chipConfig> = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    BLOCKED: "BLOCKED",
    FAULTY: "FAULTY",
    MAINTENANCE: "PENDING",
    PENDING: "PENDING",
  };

  const styleKey = statusToStyleMap[status as ChipStatus] || "DEFAULT";
  const chip = chipConfig[styleKey];

  return (
    <div
      style={{
        backgroundColor: chip.backgroundColor,
        color: chip.textColor,
        ...style,
      }}
      className={`flex gap-2 justify-center items-center rounded-xl py-1 px-2.5 text-sm transition-all ${
        showDot ? "w-auto" : "w-[100px]"
      }`}
    >
      {showDot && (
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: chip.textColor }}
        />
      )}
      {parseChipStatus(status as ChipStatus).text}
    </div>
  );
};

export default Chip;
