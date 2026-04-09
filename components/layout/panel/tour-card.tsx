"use client";

import type { CardComponentProps } from "nextstepjs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function TourCard({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-[460px] p-7 flex flex-col gap-5">
      {arrow}

      {/* Header */}
      <div className="flex items-center gap-3">
        {step.icon && <span className="text-2xl">{step.icon}</span>}
        <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>

      {/* Progress */}
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 text-right">
          {currentStep + 1} de {totalSteps}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {skipTour ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="text-gray-500 hover:text-gray-700"
          >
            Saltar tour
          </Button>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          <Button size="sm" onClick={nextStep}>
            {isLast ? (
              "Finalizar"
            ) : (
              <>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
