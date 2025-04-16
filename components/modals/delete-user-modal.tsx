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
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteUserMutation } from "@/hooks/users/use-user-query";

interface DeleteUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteUserModal({
  user,
  isOpen,
  onClose,
}: DeleteUserModalProps) {
  const [confirmationStep, setConfirmationStep] = useState<1 | 2>(1);
  const { toast } = useToast();
  const deleteUserMutation = useDeleteUserMutation();

  const handleClose = () => {
    setConfirmationStep(1);
    onClose();
  };

  const handleProceedToConfirmation = () => {
    setConfirmationStep(2);
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast({
        title: "Usuario desactivado",
        description: "El usuario ha sido desactivado exitosamente.",
        variant: "default",
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo desactivar el usuario. Intente nuevamente.",
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
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirmar desactivación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea desactivar al usuario {user.firstName}{" "}
              {user.lastName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleProceedToConfirmation}>
              Sí, desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmación final
            </DialogTitle>
            <DialogDescription>
              ¿Está realmente seguro? Esta acción cambiará el estado del usuario
              a inactivo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setConfirmationStep(1)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending
                ? "Procesando..."
                : "Confirmar desactivación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
