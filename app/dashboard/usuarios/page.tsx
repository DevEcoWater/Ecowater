import { Suspense } from "react";
import Users from "@/components/usuarios/users";

export default function UsuariosPage() {
  return (
    <div className="w-full">
      <Suspense>
        <Users />
      </Suspense>
    </div>
  );
}
