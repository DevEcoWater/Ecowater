"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { LogOutIcon } from "lucide-react";
import UserAvatar from "./profile/user-avatar";
import { useRouter } from "next/navigation";

const Profile = () => {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <UserAvatar />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 m-2">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              router.push(`/dashboard/usuarios/${session?.user.id}`)
            }
          >
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              router.push(`/dashboard/usuarios/${session?.user.id}/editar`)
            }
          >
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 cursor-pointer"
        >
          <LogOutIcon className="h-4 w-4" /> Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Profile;
