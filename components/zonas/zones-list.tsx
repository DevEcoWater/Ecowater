"use client";

import { useZonesQuery } from "@/hooks/zones/use-zones";
import { Zone } from "@/types/zones/zone-types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDateAR } from "@/lib/utils";

export function ZonesList() {
  const { data: zones, isLoading } = useZonesQuery();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/mapa">
            <MapIcon className="w-4 h-4 mr-2" />
            Ir al mapa
          </Link>
        </Button>
      </div>

      {!zones || zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <MapIcon className="w-10 h-10" />
          <p className="text-sm">No hay zonas creadas aún.</p>
          <p className="text-sm">
            Andá al{" "}
            <button
              className="text-primary underline"
              onClick={() => router.push("/dashboard/mapa")}
            >
              Mapa
            </button>{" "}
            para dibujar una zona.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Medidores</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {zones.map((zone: Zone) => (
              <TableRow key={zone.id}>
                <TableCell>
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: zone.color }}
                  />
                </TableCell>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>{zone.meter_count ?? 0}</TableCell>
                <TableCell>
                  {formatDateAR(zone.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/zonas/${zone.id}`)}
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
