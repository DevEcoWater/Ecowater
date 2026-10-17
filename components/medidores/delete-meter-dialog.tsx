"use client";

import { SecureDeleteDialog } from "../ui/secure-delete-dialog";
import { useDeleteMeterMutation } from "@/hooks/meters/use-meter-query";
import { useToast } from "@/hooks/use-toast";
import { getDeleteConfirmText } from "@/lib/meters/delete-confirm";

interface DeleteMeterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meter: { meter_id: string; device_name?: string; dev_eui?: string };
  onDeleted?: () => void;
}

export function DeleteMeterDialog({ open, onOpenChange, meter, onDeleted }: DeleteMeterDialogProps) {
  const { toast } = useToast();
  const deleteMutation = useDeleteMeterMutation();
  const expected = getDeleteConfirmText(meter.device_name);

  return (
    <SecureDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar medidor"
      confirmText={expected}
      isPending={deleteMutation.isPending}
      description={
        <>
          Esta acción es permanente. Se eliminarán el medidor{" "}
          <span className="font-semibold text-foreground">{expected}</span>
          {meter.dev_eui ? ` (${meter.dev_eui})` : ""}, todas sus lecturas e historial,
          y su asignación a usuarios.
        </>
      }
      onConfirm={async ({ password, confirmText }) => {
        await deleteMutation.mutateAsync({ id: meter.meter_id, password, confirmName: confirmText });
        toast({ title: "Medidor eliminado", description: expected });
        onDeleted?.();
      }}
    />
  );
}
