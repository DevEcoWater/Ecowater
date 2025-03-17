"use client";

import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const timeframes = {
  "1 dia": [
    { time: "12 AM", value: 10 },
    { time: "6 AM", value: 15 },
    { time: "12 PM", value: 18 },
    { time: "6 PM", value: 5 },
  ],
  "5 dias": [
    { time: "Lunes", value: 25 },
    { time: "Martes", value: 22 },
    { time: "Miercoles", value: 7 },
    { time: "Jueves", value: 20 },
    { time: "Viernes", value: 30 },
  ],
  "1 mes": [
    { time: "Semana 1", value: 18 },
    { time: "Semana 2", value: 25 },
    { time: "Semana 3", value: 4 },
    { time: "Semana 4", value: 22 },
  ],
  "6 meses": [
    { time: "Abril", value: 12 },
    { time: "Mayo", value: 42 },
    { time: "Junio", value: 32 },
    { time: "Julio", value: 23 },
    { time: "Agosto", value: 5 },
    { time: "Septiembre", value: 36 },
  ],
} as const;

type TimeframeKey = keyof typeof timeframes;

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
  mobile: {
    label: "Mobile",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface IDotsChartProps {
  title: string;
  subtitle: string;
}

const DotsChart: React.FC<IDotsChartProps> = ({ title, subtitle }) => {
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<TimeframeKey>("1 dia");
  const chartData = timeframes[selectedTimeframe];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4 justify-center">
          {Object.keys(timeframes).map((key) => (
            <Button
              key={key}
              variant={selectedTimeframe === key ? "default" : "outline"}
              onClick={() => setSelectedTimeframe(key as TimeframeKey)}
            >
              {key}
            </Button>
          ))}
        </div>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={[...chartData]}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="value"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default DotsChart;
