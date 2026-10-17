"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NextStepProvider, NextStep, useNextStep, type Tour } from "nextstepjs";
import { tours } from "@/config/tours";
import { TourCard } from "./tour-card";

const HEADER_OFFSET = 90;

function isVisible(selector: string) {
  const el = document.querySelector(selector);
  return !!el && el.getClientRects().length > 0;
}

function scrollToStep(activeTours: Tour[], step: number, tourName: string | null) {
  if (!tourName) return;
  const tour = activeTours.find((t) => t.tour === tourName);
  if (!tour) return;
  const stepData = tour.steps[step];
  if (!stepData?.selector) return;

  const el = document.querySelector(stepData.selector);
  if (!el) return;

  // Find the nearest scrollable ancestor
  let scrollParent: Element | null = el.parentElement;
  while (scrollParent) {
    const { overflow, overflowY } = window.getComputedStyle(scrollParent);
    if (/auto|scroll/.test(overflow + overflowY)) break;
    scrollParent = scrollParent.parentElement;
  }

  const container = scrollParent ?? document.documentElement;
  const elRect = el.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect?.() ?? { top: 0 };
  const scrollTop =
    container.scrollTop + (elRect.top - containerRect.top) - HEADER_OFFSET;

  container.scrollTo({ top: scrollTop, behavior: "smooth" });
}

const StartTourContext = createContext<(tourName: string) => void>(() => {});

/** Inicia una guía mostrando solo los pasos cuyo elemento está visible en la página. */
export function useStartTour() {
  return useContext(StartTourContext);
}

function TourController({ children }: { children: React.ReactNode }) {
  const { startNextStep } = useNextStep();
  const [activeTours, setActiveTours] = useState<Tour[]>(tours);
  const activeToursRef = useRef(activeTours);
  const pendingTour = useRef<string | null>(null);

  useEffect(() => {
    activeToursRef.current = activeTours;
    // Arrancamos recién cuando NextStep ya recibió los pasos filtrados
    if (pendingTour.current) {
      const name = pendingTour.current;
      pendingTour.current = null;
      startNextStep(name);
    }
  }, [activeTours, startNextStep]);

  // Si un paso apunta a algo que no está en pantalla (según rol, tipo de medidor
  // o tamaño de pantalla), la librería dejaría la tarjeta señalando el paso anterior.
  const startTour = useCallback((tourName: string) => {
    pendingTour.current = tourName;
    setActiveTours(
      tours.map((t) =>
        t.tour !== tourName
          ? t
          : { ...t, steps: t.steps.filter((s) => !s.selector || isVisible(s.selector)) }
      )
    );
  }, []);

  return (
    <StartTourContext.Provider value={startTour}>
      <NextStep
        steps={activeTours}
        shadowRgb="0,0,0"
        shadowOpacity="0.4"
        noInViewScroll
        cardComponent={TourCard}
        onStart={(tourName) => scrollToStep(activeToursRef.current, 0, tourName)}
        onStepChange={(step, tourName) => scrollToStep(activeToursRef.current, step, tourName)}
      >
        {children}
      </NextStep>
    </StartTourContext.Provider>
  );
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <TourController>{children}</TourController>
    </NextStepProvider>
  );
}
