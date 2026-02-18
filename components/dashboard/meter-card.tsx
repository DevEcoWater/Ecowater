import type React from "react";
import { chipConfig } from "@/utils/getChipColor";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { MeterStatus } from "@prisma/client";
import type { ChipStatus } from "@/components/ui/chip";

interface MeterCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isLoading: boolean;
  status: MeterStatus;
  meterDetail?: boolean;
}

const MeterCard: React.FC<MeterCardProps> = ({
  title,
  value,
  icon: Icon,
  status,
  isLoading,
  meterDetail,
}) => {
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
    <Card className="p-4 mx-auto w-full rounded-xl flex-auto border bg-white shadow-sm">
      <CardContent
        className={`flex p-0 items-center gap-4 ${
          meterDetail ? "flex-row-reverse" : "flex"
        } justify-between`}
      >
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground truncate">{title}</p>
              <h3 className="font-semibold text-lg">{value}</h3>
            </>
          )}
        </div>
        <div className="flex-shrink-0">
          <Icon
            style={{
              backgroundColor: chip.backgroundColor,
              color: chip.textColor,
            }}
            className="p-2 rounded-lg"
            width={40}
            height={40}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MeterCard;
