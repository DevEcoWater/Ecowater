import { chipConfig, MeterStatus } from "@/utils/getChipColor";
import { Skeleton } from "../ui/skeleton";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../ui/card";

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
  const { backgroundColor, textColor } =
    chipConfig[status] || chipConfig.default;
  return (
    <Card className="p-6 mx-auto w-full max-w-[250px] m md:max-w-full rounded-xl flex-auto border dark:bg-tertiary bg-white shadow-md">
      <CardContent
        className={`flex p-0 items-center gap-5 ${
          meterDetail ? "flex-row-reverse" : "flex"
        } justify-between  md:justify-center`}
      >
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-2 w-[100px] bg-gray-300 rounded-full" />
              <Skeleton className="h-2 w-[100px] bg-gray-300 rounded-full" />
            </div>
          ) : (
            <>
              <p className=" text-lg">{title}</p>
              <h2 className="font-bold text-lg">{value}</h2>
            </>
          )}
        </div>
        <div>
          <Icon
            style={{ backgroundColor, color: textColor }}
            className="p-3 rounded-lg "
            width={50}
            height={50}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MeterCard;
