"use client";

import React from "react";
import Summary from "../dashboard/summary";
import { useMetersQuery } from "@/hooks/meters/user-meter-query";

export const HomeComponent: React.FC = () => {
  const { data: meters, isLoading, error } = useMetersQuery();

  return (
    <div className="p-4 grid gap-5">
      {/* <Summary meters={meters} isLoading={isLoading} /> */}
      {/* <AreaChartComponent meters={meters} isLoading={isLoading} /> */}
    </div>
  );
};
