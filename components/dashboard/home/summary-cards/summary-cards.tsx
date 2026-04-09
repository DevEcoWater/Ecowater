"use client";

import React from "react";
import { motion } from "framer-motion";
import { ConsumptionCard } from "./consumption-card";
import { MetersCard } from "./meters-card";
import { AlertsCard } from "./alerts-card";
import { ErrorsCard } from "./errors-card";
import { MeterTypesCard } from "./meter-types-card";
import { DashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { useUrgencies } from "@/hooks/urgencies/use-urgencies";

interface SummaryCardsProps {
  stats: DashboardStats;
  consumptionTotal: number;
  previousTotal?: number;
  period: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export function SummaryCards({ stats, consumptionTotal, previousTotal, period }: SummaryCardsProps) {
  const { data: urgencies } = useUrgencies({
    includeInactive: true,
    limit: 100,
  });

  const totalErrors =
    (urgencies?.alerts.critical.length || 0) +
    (urgencies?.alerts.high.length || 0);

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants} className="h-full">
        <ConsumptionCard
          totalConsumption={consumptionTotal}
          previousTotal={previousTotal}
          period={period}
        />
      </motion.div>
      <motion.div variants={cardVariants} className="h-full">
        <MetersCard
          totalMeters={stats.meters.smart ?? stats.meters.total}
          onlineMeters={stats.meters.active}
        />
      </motion.div>
      <motion.div variants={cardVariants} className="h-full">
        <MeterTypesCard
          smart={stats.meters.smart ?? 0}
          mechanical={stats.meters.mechanical ?? 0}
        />
      </motion.div>
      <motion.div variants={cardVariants} className="h-full">
        <AlertsCard activeAlerts={stats.alerts.totalAlerts} />
      </motion.div>
      <motion.div variants={cardVariants} className="h-full">
        <ErrorsCard totalErrors={totalErrors} />
      </motion.div>
    </motion.div>
  );
}
