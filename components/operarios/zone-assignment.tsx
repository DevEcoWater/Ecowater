"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useZonesQuery } from "@/hooks/zones/use-zones";
import { useAssignZoneMutation, useRemoveZoneMutation } from "@/hooks/operarios/use-operarios";
import { useToast } from "@/hooks/use-toast";

interface Zone {
  id: string;
  name: string;
  color: string;
}

interface ZoneAssignmentProps {
  operarioId: string;
  assignedZones: Zone[];
}

export default function ZoneAssignment({ operarioId, assignedZones }: ZoneAssignmentProps) {
  const { toast } = useToast();
  const { data: allZones } = useZonesQuery();
  const assignZone = useAssignZoneMutation();
  const removeZone = useRemoveZoneMutation();
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");

  const assignedIds = new Set(assignedZones.map((z) => z.id));
  const availableZones = allZones?.filter((z) => !assignedIds.has(z.id)) ?? [];

  const handleAssign = async () => {
    if (!selectedZoneId) return;
    try {
      await assignZone.mutateAsync({ operarioId, zone_id: selectedZoneId });
      setSelectedZoneId("");
      toast({ title: "Zona asignada" });
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    }
  };

  const handleRemove = async (zoneId: string) => {
    try {
      await removeZone.mutateAsync({ operarioId, zoneId });
      toast({ title: "Asignación eliminada" });
    } catch {
      toast({ title: "Error al eliminar asignación", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {assignedZones.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin zonas asignadas</p>
        )}
        {assignedZones.map((zone) => (
          <Badge
            key={zone.id}
            variant="outline"
            className="flex items-center gap-1.5 pl-2 pr-1 py-1"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: zone.color }}
            />
            {zone.name}
            <button
              onClick={() => handleRemove(zone.id)}
              className="ml-1 hover:text-destructive transition-colors"
              disabled={removeZone.isPending}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {availableZones.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Seleccionar zona" />
            </SelectTrigger>
            <SelectContent>
              {availableZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    {zone.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={!selectedZoneId || assignZone.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Asignar
          </Button>
        </div>
      )}
    </div>
  );
}
