"use client";

import React from "react";
import Summary from "../dashboard/summary";
import { AreaChartComponent } from "../ui/area-chart";
import { useMeters } from "@/hooks/useMeter";

export const HomeComponent: React.FC = () => {
  const { data: meters, isLoading, error } = useMeters();

  return (
    <div className="p-4 grid gap-5">
      <Summary meters={meters} isLoading={isLoading} />
      <AreaChartComponent meters={meters} isLoading={isLoading} />
    </div>
  );
};
