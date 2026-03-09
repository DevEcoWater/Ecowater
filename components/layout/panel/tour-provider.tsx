"use client";

import { NextStepProvider, NextStep } from "nextstepjs";
import { tours } from "@/config/tours";
import { TourCard } from "./tour-card";

const HEADER_OFFSET = 90;

function scrollToStep(step: number, tourName: string | null) {
  if (!tourName) return;
  const tour = tours.find((t) => t.tour === tourName);
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

export function TourProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep
        steps={tours}
        shadowRgb="0,0,0"
        shadowOpacity="0.4"
        noInViewScroll
        cardComponent={TourCard}
        onStart={(tourName) => scrollToStep(0, tourName)}
        onStepChange={(step, tourName) => scrollToStep(step, tourName)}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
