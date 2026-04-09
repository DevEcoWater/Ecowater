"use client";

import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, MapPin } from "lucide-react";
import { ReadingRouteItem } from "@/types/operarios/operario-types";
import dayjs from "dayjs";

interface ReadingRouteItemProps {
  item: ReadingRouteItem;
  zoneId: string;
}

export function ReadingRouteItemCard({ item, zoneId }: ReadingRouteItemProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/portal/zonas/${zoneId}/medidores/${item.id}`)}
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-h-[72px] flex items-center gap-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base">
          {item.street_address ?? item.device_name}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {item.userName ?? "Sin usuario"} · Medidor ID: {item.id.slice(-9)}
        </p>
      </div>

      {/* Status */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {item.read_today ? (
          <>
            <span className="text-xs text-gray-400">
              {item.reading_time_today
                ? dayjs(item.reading_time_today).format("HH:mm")
                : ""}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              Leído
            </span>
          </>
        ) : (
          <>
            <span className="text-xs text-gray-400">
              {item.last_reading_date
                ? dayjs(item.last_reading_date).format("HH:mm")
                : ""}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
              <Clock className="w-4 h-4" />
              Pendiente
            </span>
          </>
        )}
      </div>
    </button>
  );
}
