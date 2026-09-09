import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Activity } from "lucide-react";

export function UserInfoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile header skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Avatar + identity */}
            <div className="flex items-start gap-4">
              <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>

          {/* Address + date */}
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles y Permisos card skeleton */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground/40" />
            <CardTitle className="text-lg font-semibold text-muted-foreground/40">
              Roles y Permisos
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Medidor card skeleton */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground/40" />
            <CardTitle className="text-lg font-semibold text-muted-foreground/40">
              Información del Medidor
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="pt-4 border-t">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
