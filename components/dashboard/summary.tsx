import { MeterStatus } from "@/utils/getChipColor";
import { Gauge } from "lucide-react";
import MeterCard from "./meter-card";

interface ISummary {
  meters: any;
  isLoading: boolean;
}

const Summary: React.FC<ISummary> = ({ meters, isLoading }) => {
  const counts =
    !isLoading &&
    meters.reduce(
      (acc: Record<MeterStatus, number>, meter: any) => {
        acc[meter.status as MeterStatus] =
          (acc[meter.status as MeterStatus] || 0) + 1;
        return acc;
      },
      { active: 0, inactive: 0, error: 0, default: meters.length }
    );

  const summaryData = [
    {
      title: "Total",
      value: !isLoading && counts.default.toString(),
      icon: Gauge,
      status: "default",
    },
    {
      title: "En línea",
      value: !isLoading && counts.active.toString(),
      icon: Gauge,
      status: "active",
    },
    {
      title: "Alerta",
      value: !isLoading && counts.inactive.toString(),
      icon: Gauge,
      status: "inactive",
    },
    {
      title: "Error",
      value: !isLoading && counts.error.toString(),
      icon: Gauge,
      status: "error",
    },
  ];

  return (
    <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-10 mb-3">
      {summaryData.map((data, index) => (
        <MeterCard
          key={index}
          title={data.title}
          value={data.value}
          icon={data.icon}
          status={data.status as MeterStatus}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default Summary;
