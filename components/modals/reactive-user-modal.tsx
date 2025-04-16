"use client";

import { useState } from "react";
import type { User } from "@/types/users/user-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReactivateUserMutation } from "@/hooks/users/use-user-query";

interface ReactivateUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReactivateUserModal({
  user,
  isOpen,
  onClose,
}: ReactivateUserModalProps) {
  const [confirmationStep, setConfirmationStep] = useState<1 | 2>(1);
  const { toast } = useToast();
  const reactivateUserMutation = useReactivateUserMutation();

  const handleClose = () => {
    setConfirmationStep(1);
    onClose();
  };

  const handleProceedToConfirmation = () => {
    setConfirmationStep(2);
  };

  const handleReactivateUser = async () => {
    if (!user) return;

    try {
      await reactivateUserMutation.mutateAsync(user.id);
      toast({
        title: "Usuario reactivado",
        description: "El usuario ha sido reactivado exitosamente.",
        variant: "default",
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reactivar el usuario. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      {confirmationStep === 1 ? (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Confirmar reactivación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea reactivar al usuario {user.firstName}{" "}
              {user.lastName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleProceedToConfirmation}
            >
              Sí, reactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-green-500" />
              Confirmación final
            </DialogTitle>
            <DialogDescription>
              ¿Está realmente seguro? Esta acción cambiará el estado del usuario
              a activo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmationStep(1)}>
              Volver
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleReactivateUser}
              disabled={reactivateUserMutation.isPending}
            >
              {reactivateUserMutation.isPending
                ? "Procesando..."
                : "Confirmar reactivación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
