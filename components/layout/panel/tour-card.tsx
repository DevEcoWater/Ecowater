"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CardComponentProps } from "nextstepjs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const VIEWPORT_MARGIN = 12;

/**
 * nextstepjs posiciona la tarjeta pegada al elemento sin mirar los bordes de
 * la ventana; si no entra, la corremos lo justo para que quede visible.
 */
function useKeepInViewport(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Medimos sin el corrimiento actual para no acumularlo
        el.style.translate = "0 0";
        const rect = el.getBoundingClientRect();
        const maxX = window.innerWidth - VIEWPORT_MARGIN;
        const maxY = window.innerHeight - VIEWPORT_MARGIN;

        let x = 0;
        if (rect.left < VIEWPORT_MARGIN) x = VIEWPORT_MARGIN - rect.left;
        else if (rect.right > maxX) x = maxX - rect.right;

        let y = 0;
        if (rect.top < VIEWPORT_MARGIN) y = VIEWPORT_MARGIN - rect.top;
        else if (rect.bottom > maxY) y = Math.max(maxY - rect.bottom, VIEWPORT_MARGIN - rect.top);

        el.style.translate = `${x}px ${y}px`;
        setOffset((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
      });
    };

    // La librería anima la tarjeta hasta su lugar: medimos al montar y cuando termina
    measure();
    const settle = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, shifted: offset.x !== 0 || offset.y !== 0 };
}

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
  const { ref, shifted } = useKeepInViewport([currentStep, step.selector]);

  return (
    <div
      ref={ref}
      className="relative bg-popover text-popover-foreground rounded-xl shadow-2xl border w-[min(400px,calc(100vw-24px))] p-5 sm:p-6 flex flex-col gap-4"
    >
      {/* Si la corrimos para que entre en pantalla, la flecha ya no apunta bien */}
      {!shifted && arrow}

      {/* Header */}
      <div className="flex items-start gap-3">
        {step.icon && (
          <span className="shrink-0 rounded-lg bg-primary/10 text-primary p-2 [&>svg]:h-5 [&>svg]:w-5">
            {step.icon}
          </span>
        )}
        <h3 className="text-lg font-semibold leading-tight pt-1 flex-1">{step.title}</h3>
        {skipTour && (
          <button
            type="button"
            onClick={skipTour}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar guía"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="text-sm text-muted-foreground leading-relaxed">{step.content}</div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {currentStep + 1} de {totalSteps}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        {skipTour && !isLast ? (
          <Button variant="ghost" size="sm" onClick={skipTour} className="text-muted-foreground">
            Saltar guía
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
