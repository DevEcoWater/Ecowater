"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";

import {
  MoreHorizontal,
  User2,
  NotebookPen,
  Gauge,
  Trash2,
  RefreshCw,
} from "lucide-react";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DeleteUserModal } from "../modals/delete-user-modal";
import { ReactivateUserModal } from "../modals/reactive-user-modal";

interface UserActionsProps {
  user: User;
  onViewDetails?: (user: User) => void;
  onEdit?: (user: User) => void;
  onViewMeter?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export const UserActions = ({
  user,
  onViewDetails,
  onEdit,
  onViewMeter,
  onDelete,
}: UserActionsProps) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<User | null>(null);

  const isUserInactive =
    user.status === "INACTIVE" || user.status === "BLOCKED";

  const handleViewUser = () => {
    router.push(`/dashboard/usuarios/detalle/${user.id}`);
  };

  const handleEditUser = () => {
    router.push(`/dashboard/usuarios/editar/${user.id}`);
  };

  const handleViewMeter = () => {
    // router.push(`/dashboard/medidores/${user.id}`); // <-- update when ready
  };

  const handleDelete = () => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleReactivate = () => {
    setUserToReactivate(user);
    setIsReactivateModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const handleCloseReactivateModal = () => {
    setIsReactivateModalOpen(false);
    setUserToReactivate(null);
  };

  return (
    <>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          // portalled={false}
          collisionPadding={10}
        >
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={handleViewUser}
          >
            <User2 className="h-4 w-4" />
            Detalle del usuario
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={handleEditUser}
          >
            <NotebookPen className="h-4 w-4" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={handleViewMeter}
          >
            <Gauge className="h-4 w-4" />
            Medidor asignado
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isUserInactive ? (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 text-green-600"
              onSelect={handleReactivate}
            >
              <RefreshCw className="h-4 w-4" />
              Reactivar usuario
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 text-destructive"
              onSelect={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Desactivar usuario
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteUserModal
        user={userToDelete}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
      />

      <ReactivateUserModal
        user={userToReactivate}
        isOpen={isReactivateModalOpen}
        onClose={handleCloseReactivateModal}
      />
    </>
  );
};
