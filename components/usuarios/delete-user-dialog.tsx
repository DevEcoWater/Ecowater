"use client";

import { SecureDeleteDialog } from "../ui/secure-delete-dialog";
import { usePermanentDeleteUserMutation } from "@/hooks/users/use-user-query";
import { useToast } from "@/hooks/use-toast";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; email: string; firstName?: string; lastName?: string };
  onDeleted?: () => void;
}

export function DeleteUserDialog({ open, onOpenChange, user, onDeleted }: DeleteUserDialogProps) {
  const { toast } = useToast();
  const deleteMutation = usePermanentDeleteUserMutation();
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  return (
    <SecureDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Eliminar usuario"
      confirmText={user.email}
      isPending={deleteMutation.isPending}
      description={
        <>
          Esta acción es permanente. Se eliminará la cuenta de{" "}
          <span className="font-semibold text-foreground">{fullName}</span>, su dirección,
          sus roles y la asignación de medidores y zonas. Las lecturas que haya registrado se
          conservan sin autor. Si solo querés quitarle el acceso, usá «Desactivar usuario».
        </>
      }
      onConfirm={async ({ password, confirmText }) => {
        await deleteMutation.mutateAsync({ id: user.id, password, confirmEmail: confirmText });
        toast({ title: "Usuario eliminado", description: fullName });
        onDeleted?.();
      }}
    />
  );
}
