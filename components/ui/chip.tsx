import { UserStatus } from "@/types/users/user-types";
import { chipConfig, MeterStatus, userConfig } from "@/utils/getChipColor";
import type React from "react";

type Props = {
  status: MeterStatus | UserStatus; // This will allow both MeterStatus and UserStatus
  text: string;
  showDot?: boolean;
  user?: boolean; // Whether to use userConfig or chipConfig
};

const Chip: React.FC<Props> = ({
  text,
  status,
  showDot = false,
  user = false,
}) => {
  const configToUse = user ? userConfig : chipConfig;

  const chip =
    configToUse[status as keyof typeof configToUse] || chipConfig.default;

  if (!chip) {
    console.error(`Invalid status: ${status}`);
    return null;
  }

  return (
    <div
      style={{ backgroundColor: chip.backgroundColor, color: chip.textColor }}
      className={`flex gap-2 justify-center items-center rounded-xl py-1 px-2.5 text-sm text-white transition-all ${
        showDot ? "w-auto" : "w-[100px]"
      }`}
    >
      {showDot && (
        <span
          className="w-1 h-1 rounded-full"
          style={{ backgroundColor: chip.textColor }}
        />
      )}
      {text}
    </div>
  );
};

export default Chip;
