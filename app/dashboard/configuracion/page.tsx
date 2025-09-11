import { Suspense } from "react";
import { AccountSection } from "./account-section";
export default function MetersPage() {
  return (
    <div className="w-full">
      <Suspense>
        <AccountSection />
      </Suspense>
    </div>
  );
}
