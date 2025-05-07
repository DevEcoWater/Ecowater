import { Header } from "@/components/layout/panel/header";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";
import React from "react";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/ui/map"), { ssr: false });

export default function Mapa() {
  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Profile />
        </div>
      </Header>

      {/* ===== Content ===== */}
      <Main>
        <Map />
      </Main>
    </>
  );
}
