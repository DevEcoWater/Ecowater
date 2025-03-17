import AnalyticsCard from "@/components/dashboard/analytics-card";
import Users from "@/components/users/users";

export default async function Usuarios() {
  return (
    <div className="p-4">
      <AnalyticsCard create>
        <Users />
      </AnalyticsCard>
    </div>
  );
}
