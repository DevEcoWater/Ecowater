import Map from "@/components/ui/map";
import React from "react";

export default async function Mapa() {
  return (
    <div className="grid lg:grid-cols-1 gap-10">
      <Map />
    </div>
  );
}
