import { Cpu, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type MeterTypeChipProps = {
  type: string;
  className?: string;
};

export function MeterTypeChip({ type, className }: MeterTypeChipProps) {
  const isMechanical = type === "MECHANICAL";

  if (isMechanical) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
          "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
          className
        )}
      >
        <Wrench className="w-3 h-3" />
        Mecánico
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        className
      )}
    >
      <Cpu className="w-3 h-3" />
      Inteligente
    </span>
  );
}
