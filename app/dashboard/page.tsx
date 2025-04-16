import { HomeComponent } from "@/components/home/home";
import { Header } from "@/components/layout/panel/header";
import { Main } from "@/components/layout/panel/main";
import Profile from "@/components/profile";

export default async function Home() {
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Profile />
      </Header>

      {/* ===== Content ===== */}
      <Main fixed>
        <HomeComponent />
      </Main>
    </>
  );
}
