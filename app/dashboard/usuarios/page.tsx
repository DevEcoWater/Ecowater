import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Users from "@/components/usuarios/users";

export default function UsuariosPage() {
  return (
    <div className="w-full">
      <Suspense fallback={<UsersListSkeleton />}>
        <Users />
      </Suspense>
    </div>
  );
}

function UsersListSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
