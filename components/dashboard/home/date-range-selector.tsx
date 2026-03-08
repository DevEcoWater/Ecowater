"use client";

import React, { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardPeriod } from "@/hooks/dashboard/use-consumption-data";
import dayjs from "dayjs";

const PERIODS: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "1 semana" },
  { value: "30d", label: "1 mes" },
  { value: "90d", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
];

interface DateRangeSelectorProps {
  selectedPeriod: DashboardPeriod;
  customRange: { startDate: string; endDate: string } | null;
  onPeriodSelect: (period: DashboardPeriod) => void;
  onRangeApply: (startDate: string, endDate: string) => void;
  onRangeClear: () => void;
}

export function DateRangeSelector({
  selectedPeriod,
  customRange,
  onPeriodSelect,
  onRangeApply,
  onRangeClear,
}: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  function handlePeriodClick(period: DashboardPeriod) {
    onPeriodSelect(period);
  }

  function handleOpenModal() {
    setRange(
      customRange
        ? { from: new Date(customRange.startDate), to: new Date(customRange.endDate) }
        : undefined
    );
    setOpen(true);
  }

  function handleApply() {
    if (range?.from && range?.to) {
      onRangeApply(
        dayjs(range.from).format("YYYY-MM-DD"),
        dayjs(range.to).format("YYYY-MM-DD")
      );
      setOpen(false);
    }
  }

  function handleClear() {
    setRange(undefined);
    onRangeClear();
  }

  const customRangeLabel = customRange
    ? `${dayjs(customRange.startDate).format("DD/MM/YY")} — ${dayjs(customRange.endDate).format("DD/MM/YY")}`
    : null;

  const rangeSelectionHint =
    range?.from && range?.to
      ? `${dayjs(range.from).format("DD MMM YYYY")} → ${dayjs(range.to).format("DD MMM YYYY")}`
      : range?.from
      ? `Desde ${dayjs(range.from).format("DD MMM YYYY")} — seleccioná la fecha de fin`
      : "Seleccioná el rango en el calendario";

  return (
    <>
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Períodos predefinidos */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {PERIODS.map((p) => (
                <Button
                  key={p.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePeriodClick(p.value)}
                  className={cn(
                    "text-xs px-3 py-1 h-auto",
                    !customRange && selectedPeriod === p.value
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  )}
                >
                  {p.label}
                </Button>
              ))}
            </div>

            <div className="h-5 w-px bg-gray-200" />

            {/* Botón personalizado */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenModal}
              className={cn(
                "text-xs h-8 px-3 gap-1.5 border",
                customRange
                  ? "border-blue-200 bg-blue-50 text-blue-600"
                  : "border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {customRangeLabel ?? "Personalizado"}
            </Button>

            {/* Limpiar rango */}
            {customRange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal con calendario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Seleccionar rango de fechas</DialogTitle>
          </DialogHeader>

          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            className="mx-auto"
          />

          <p className="text-xs text-gray-500 text-center">{rangeSelectionHint}</p>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-gray-500"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!range?.from || !range?.to}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
