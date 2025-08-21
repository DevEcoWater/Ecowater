import { HomeComponent } from "@/components/home/home";
import { Main } from "@/components/layout/panel/main";

export default async function Home() {
  return (
    <>
      <Main fixed>
        <HomeComponent />
      </Main>
    </>
  );
}
