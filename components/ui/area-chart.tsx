"use client";

import {
  Area,
  AreaChart as Chart,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
} from "recharts";

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
import { Skeleton } from "./skeleton";

interface AreaChartProps {
  meters?: {
    status: string;
    createdAt: string;
  }[];
  isLoading: boolean;
}

const chartConfig = {
  success: {
    label: "En linea",
    color: "hsl(var(--chart-success))",
  },
  alerta: {
    label: "Alerta",
    color: "hsl(var(--chart-warning))",
  },
  error: {
    label: "Error",
    color: "hsl(var(--chart-error))",
  },
} satisfies ChartConfig;

const daysOfWeek = [
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
  "Domingo",
];

const aggregateMetersByDay = (meters: AreaChartProps["meters"]) => {
  const weekData = daysOfWeek.map((day) => ({
    day,
    success: 0,
    alerta: 0,
    error: 0,
  }));

  meters?.forEach((meter) => {
    if (!meter || !meter.status || !meter.createdAt) {
      return;
    }

    const date = new Date(meter.createdAt);
    const dayIndex = (date.getDay() + 6) % 7;
    const dayKey = weekData[dayIndex];

    switch (meter.status) {
      case "active":
        dayKey.success++;
        break;
      case "inactive":
        dayKey.alerta++;
        break;
      case "error":
        dayKey.error++;
        break;
      default:
        console.warn(`Unknown status for meter: ${meter.status}`);
    }
  });

  return weekData;
};

export function AreaChartComponent({ meters, isLoading }: AreaChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <Skeleton className="h-3 w-[80px] bg-gray-300 rounded-full" />
          <Skeleton className="h-3 w-[120px] bg-gray-300 rounded-full" />
        </CardHeader>
        <CardContent>
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-[536px] w-full bg-gray-300 " />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!meters) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <CardTitle>Medidores</CardTitle>
          </CardTitle>
          <CardDescription>
            <CardDescription>Estados de la última semana</CardDescription>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <p className="text-muted-foreground">
              No hay información disponible
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = aggregateMetersByDay(meters);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medidores</CardTitle>
        <CardDescription>Estados de la última semana</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={4}
              domain={[0, "dataMax"]}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey="success"
              type="basis"
              fill="#22BB33"
              fillOpacity={0.4}
              stroke="#22BB33"
              stackId="a"
            />
            <Area
              dataKey="alerta"
              type="basis"
              fill="#f0ad4e"
              fillOpacity={0.4}
              stroke="#f0ad4e"
              stackId="b"
            />
            <Area
              dataKey="error"
              type="basis"
              fill="#fe3839"
              fillOpacity={0.4}
              stroke="#fe3839"
              stackId="c"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
