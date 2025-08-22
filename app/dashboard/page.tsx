import { HomeDashboard } from "@/components/dashboard/home/home-dashboard";
import { Main } from "@/components/layout/panel/main";

export default async function Home() {
  return (
    <>
      <Main fixed>
        <HomeDashboard />
      </Main>
    </>
  );
}
