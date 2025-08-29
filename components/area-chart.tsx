"use client";
import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReadingData = {
  timestamp: string;
  cumulative_flow?: any;
  [key: string]: any;
};

type ChartAreaInteractiveProps = {
  data: ReadingData[];
  enableTimeRange?: boolean;
  children?: React.ReactNode;
};

const parseCumulativeFlow = (flowValue: any): number => {
  // Handle null, undefined, or empty values
  if (!flowValue && flowValue !== 0) return 0;

  // If it's already a number, return it
  if (typeof flowValue === "number") return flowValue;

  // If it's not a string, try to convert to string first
  const flowString = String(flowValue);

  // Remove units and parse as float
  const cleanedValue = flowString.replace(/m3|m³/g, "").trim();

  // Parse the number, return 0 if invalid
  const parsed = Number.parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

const formatTimeForRange = (timestamp: string, range: string): string => {
  const date = new Date(timestamp);

  switch (range) {
    case "day":
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "week":
      return date.toLocaleDateString("es-ES", { weekday: "long" });
    case "month":
      const weekNumber = Math.ceil(date.getDate() / 7);
      return `Sem ${weekNumber}`;
    case "6months":
      return date.toLocaleDateString("es-ES", { month: "long" });
    default:
      return date.toLocaleDateString("es-ES");
  }
};

const processDataForTimeRange = (data: ReadingData[], timeRange: string) => {
  if (!data || data.length === 0) return [];

  const now = new Date();
  let filteredData: ReadingData[] = [];

  switch (timeRange) {
    case "day":
      // Get last 24 hours of data
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      filteredData = data.filter((item) => new Date(item.timestamp) >= dayAgo);
      break;
    case "week":
      // Get last 7 days of data
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredData = data.filter((item) => new Date(item.timestamp) >= weekAgo);
      break;
    case "month":
      // Get last 30 days of data
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredData = data.filter(
        (item) => new Date(item.timestamp) >= monthAgo
      );
      break;
    case "6months":
      // Get last 6 months of data
      const sixMonthsAgo = new Date(
        now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000
      );
      filteredData = data.filter(
        (item) => new Date(item.timestamp) >= sixMonthsAgo
      );
      break;
    default:
      filteredData = data;
  }

  // Sort by timestamp and transform data
  return filteredData
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    .map((item) => ({
      time: formatTimeForRange(item.timestamp, timeRange),
      cumulative_flow: parseCumulativeFlow(item.cumulative_flow),
      originalTimestamp: item.timestamp,
    }));
};

export function ChartAreaInteractive({
  data,
  enableTimeRange = true,
  children,
}: ChartAreaInteractiveProps) {
  const [timeRange, setTimeRange] = React.useState("6months");

  const chartData = React.useMemo(() => {
    return processDataForTimeRange(data, timeRange);
  }, [data, timeRange]);

  const chartConfig = {
    cumulative_flow: {
      label: "Flujo Acumulado",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center justify-between py-5 border-b">
        {children}
        {enableTimeRange && (
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-lg sm:flex hidden">
              <SelectValue placeholder="Período de tiempo" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="day">1 día</SelectItem>
              <SelectItem value="week">1 semana</SelectItem>
              <SelectItem value="month">1 mes</SelectItem>
              <SelectItem value="6months">6 meses</SelectItem>
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              <linearGradient
                id="fill-cumulative_flow"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="hsl(var(--chart-3))"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--chart-3))"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${value}`}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="cumulative_flow"
              type="natural"
              fill="url(#fill-cumulative_flow)"
              stroke="hsl(var(--chart-3))"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
