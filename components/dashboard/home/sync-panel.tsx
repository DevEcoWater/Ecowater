"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface SyncPanelProps {
  initialTimestamp: string | null;
}

function getRelativeLabel(date: Date | null): string {
  if (!date) return "Sincronizando...";
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return `hace ${diffSec} seg`;
  if (diffSec < 3600) return `hace ${Math.floor(diffSec / 60)} min`;
  return `hace ${Math.floor(diffSec / 3600)} h`;
}

const DASHBOARD_QUERY_KEYS = [
  ["dashboard-stats"],
  ["consumption-data"],
  ["meter-distribution"],
  ["alarm-trends"],
] as const;

export function SyncPanel({ initialTimestamp }: SyncPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [label, setLabel] = useState("Sincronizando...");
  const [isSyncing, setIsSyncing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize lastSyncAt from the cache-population timestamp on first data load
  useEffect(() => {
    if (initialTimestamp && !lastSyncAt) {
      const parsed = new Date(initialTimestamp);
      if (!isNaN(parsed.getTime())) {
        setLastSyncAt(parsed);
        setLabel(getRelativeLabel(parsed));
      }
    }
  }, [initialTimestamp, lastSyncAt]);

  // Update relative label every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLabel(getRelativeLabel(lastSyncAt));
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastSyncAt]);

  async function handleResync() {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const res = await fetch("/api/dashboard/revalidate", { method: "POST" });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      await Promise.all(
        DASHBOARD_QUERY_KEYS.map((key) =>
          queryClient.refetchQueries({ queryKey: key })
        )
      );

      const now = new Date();
      setLastSyncAt(now);
      setLabel(getRelativeLabel(now));
    } catch (e) {
      toast({
        title: "Error al sincronizar",
        description: e instanceof Error ? e.message : "Intente nuevamente",
      });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <Clock className="w-4 h-4" />
        <span>{label}</span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleResync}
        disabled={isSyncing}
        className="h-7 px-2 text-xs gap-1.5"
      >
        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
        {isSyncing ? "Sincronizando..." : "Re-sincronizar"}
      </Button>
    </div>
  );
}
