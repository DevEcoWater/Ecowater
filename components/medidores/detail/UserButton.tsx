"use client";

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserButtonProps {
  userId?: string | null;
}

export function UserButton({ userId }: UserButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (userId) {
      router.push(`/dashboard/usuarios/${userId}`);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={!userId}
      className={`${
        !userId
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <User size={16} />
    </Button>
  );
}
