"use client";

import { useSession } from "next-auth/react";
import { NoPermissions } from "@/components/profile/no-permissions";
import { CooperativeForm } from "./cooperative-form";

export function AccountSection() {
  const { data: session } = useSession();

  const userRoles = session.user.role || [];
  const isAdmin = userRoles.includes("admin");

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <CooperativeForm />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <NoPermissions />
    </div>
  );
}
