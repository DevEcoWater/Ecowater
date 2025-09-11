import { Suspense } from "react";
import { AccountSection } from "@/components/cooperative/account-section";
export default function MetersPage() {
  return (
    <div className="w-full">
      <Suspense>
        <AccountSection />
      </Suspense>
    </div>
  );
}
