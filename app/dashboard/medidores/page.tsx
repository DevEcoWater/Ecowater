import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Meters from "@/components/medidores/meters";

export default function MetersPage() {
  return (
    <div className="w-full">
      <Suspense>
        <Meters />
      </Suspense>
    </div>
  );
}
