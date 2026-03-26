import { Suspense } from "react";
import { ZonesList } from "@/components/zonas/zones-list";

export default function ZonasPage() {
  return (
    <Suspense fallback={null}>
      <ZonesList />
    </Suspense>
  );
}
