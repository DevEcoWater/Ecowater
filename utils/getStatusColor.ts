import { chipConfig } from "./getChipColor";
import { MeterStatus, UserStatus } from "@prisma/client";

export type ChipStatus = MeterStatus | UserStatus | "DEFAULT";

export function getStatusColor(status: ChipStatus) {
  const statusToStyleMap: Record<ChipStatus, keyof typeof chipConfig> = {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    BLOCKED: "BLOCKED",
    FAULTY: "FAULTY",
    MAINTENANCE: "PENDING",
    PENDING: "PENDING",
    DEFAULT: "DEFAULT",
  };

  const styleKey = statusToStyleMap[status] || "DEFAULT";
  return {
    color: chipConfig[styleKey]?.textColor || "#ccc",
    backgroundColor: chipConfig[styleKey]?.backgroundColor || "#ccc",
  };
}
