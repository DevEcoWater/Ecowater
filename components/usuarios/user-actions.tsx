"use client";

import { useState } from "react";
import type React from "react";

import {
  MoreHorizontal,
  User2,
  NotebookPen,
  Gauge,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import type { User } from "@/types/users/user-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useRouter } from "next/navigation";
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

  const isUserInactive = user.status === "INACTIVE";

  const handleRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/usuarios/editar/${user.id}`);
  };

  const handleViewMeter = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/medidores/${user.meterId}`);
  };

  const handleViewUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/usuarios/detalle/${user.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleReactivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              handleViewUser(e as unknown as React.MouseEvent);
            }}
          >
            <User2 className="h-4 w-4" />
            Detalle del usuario
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              handleRedirect(e as unknown as React.MouseEvent);
            }}
          >
            <NotebookPen className="h-4 w-4" />
            Editar usuario
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              handleViewMeter(e as unknown as React.MouseEvent);
            }}
          >
            <Gauge className="h-4 w-4" />
            Medidor asignado
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {isUserInactive ? (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 text-green-600"
              onSelect={(e) => {
                e.preventDefault();
                handleReactivate(e as unknown as React.MouseEvent);
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Reactivar usuario
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="cursor-pointer flex items-center gap-2 text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                handleDelete(e as unknown as React.MouseEvent);
              }}
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
