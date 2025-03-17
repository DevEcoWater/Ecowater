import { chipConfig } from "@/utils/getChipColor";
import React from "react";

type MeterStatus = keyof typeof chipConfig;

type Props = {
  status: MeterStatus;
  text: string;
  showDot?: boolean;
};

const Chip: React.FC<Props> = ({ text, status, showDot = false }) => {
  const chip = chipConfig[status] ?? chipConfig.default;

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
