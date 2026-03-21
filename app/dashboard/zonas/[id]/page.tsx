"use client";

import { useParams } from "next/navigation";
import { ZoneDetail } from "@/components/zonas/zone-detail";

export default function ZonaDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <ZoneDetail id={id} />;
}
