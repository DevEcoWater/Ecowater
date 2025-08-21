import React from "react";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

export default function Mapa() {
  return <Map />;
}
