import AnalyticsCard from "@/components/dashboard/analytics-card";
import Users from "@/components/usuarios/users";

export default async function Usuarios() {
  return (
    <div className="p-4">
      <AnalyticsCard
        title="Usuarios"
        subTitle="Acá podras visualizar a todos los usuarios registrados"
      >
        <Users />
      </AnalyticsCard>
    </div>
  );
}
