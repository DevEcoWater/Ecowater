import { Header } from "@/components/layout/panel/header";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";
import Map from "@/components/ui/map";
import React from "react";

export default async function Mapa() {
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
