"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Chip from "@/components/ui/chip";
import {
  Clock,
  Database,
  Droplets,
  ChartColumn,
  ThermometerSun,
  Activity,
  TriangleAlert,
} from "lucide-react";
import MeterCard from "@/components/dashboard/meter-card";
import SystemStatus from "@/components/dashboard/system-status";
import DotsChart from "@/components/ui/dots-chart";
import { Header } from "@/components/layout/panel/header";
import Profile from "@/components/profile";
import { Main } from "@/components/layout/panel/main";
import { MeterStatus } from "@prisma/client";

const mockData = {
  meterId: "A12345",
  serial: "987654",
  id: "456789",
  lastUpdated: "19/02/2025 15:30",
  status: "ACTIVE" as MeterStatus,
  accumulatedFlow: 1234.56,
  instantFlow: 0.75,
  reverseFlow: 0.02,
  temperature: 24.5,
  systemStatus: "Operativo",
  signal: "Excelente",
  alerts: [
    "Flujo inverso detectado (0.02 m³)",
    "Consumo 25% mayor al promedio",
  ],
};

const metrics = [
  {
    title: "Flujo Acumulado",
    value: `${mockData.accumulatedFlow} m³`,
    icon: Droplets,
    status: "default",
  },
  {
    title: "Flujo Instantáneo",
    value: `${mockData.instantFlow} m³/h`,
    icon: ChartColumn,
    status: "default",
  },
  {
    title: "Flujo Reverso",
    value: `${mockData.reverseFlow} m³`,
    icon: Activity,
    status: "error",
  },
  {
    title: "Temperatura",
    value: `${mockData.temperature}°C`,
    icon: ThermometerSun,
    status: "inactive",
  },
];

const MeterDashboard = () => {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Profile />
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Main>
        <div className="p-6 mx-auto">
          {/* Meter Header */}
          <Card className="p-6 mb-4">
            <CardContent className="flex justify-between items-center p-0">
              <div className="flex gap-3 justify-center items-center">
                <Database
                  style={{ backgroundColor: "#dbeaff", color: "#5a88ee" }}
                  className="p-3 rounded-lg"
                  size={50}
                />
                <div className="flex flex-col items-start justify-center">
                  <h2 className="text-xl font-bold">
                    Medidor #{mockData.meterId}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    SER: {mockData.serial} • ID: {mockData.id}
                  </p>
                </div>
              </div>
              <div className="flex gap-5 justify-center items-center">
                <div className="flex gap-2 justify-center items-center">
                  <Clock size={20} />
                  <p className="text-sm text-muted-foreground">
                    Última actualización: {mockData.lastUpdated}
                  </p>
                </div>
                <Chip showDot status={mockData.status} />
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4 mb-4">
            {metrics.map((data, index) => (
              <MeterCard
                meterDetail
                key={index}
                title={data.title}
                value={data.value}
                icon={data.icon}
                status={data.status as MeterStatus}
                isLoading={false}
              />
            ))}
          </div>

          {/* Chart and Side Info */}
          <div className="grid grid-cols-1 md:grid-cols-[60%_auto] gap-4 mb-4">
            <Card>
              <DotsChart
                title="Consumo de agua en tiempo real"
                subtitle="Monitoreo de agua en las últimas 24 horas"
              />
            </Card>
            <div className="flex flex-col gap-4">
              <Card className="flex flex-col gap-5 p-4">
                <SystemStatus type="system" status="Operativo" />
                <SystemStatus type="signal" status="Excelente" />
              </Card>
              <Card>
                <CardContent className="flex flex-col gap-2">
                  <h4 className="font-semibold mt-2">Últimas alertas</h4>
                  <div className="flex flex-col gap-2">
                    {mockData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-start gap-2 p-4 border rounded-lg"
                      >
                        <TriangleAlert size={15} />
                        <p className="text-sm">{alert}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Main>
    </>
  );
};

export default MeterDashboard;
