"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { CirclePlus } from "lucide-react";

const AnalyticsCard = ({
  children,
  title,
  subTitle,
  create,
}: {
  children: React.ReactNode;
  title?: string;
  subTitle?: string;
  create?: boolean;
}) => {
  const router = useRouter();

  const handleRedirect = () => {
    router.push("/dashboard/usuarios/registro");
  };

  return (
    <div className="dark:bg-tertiary border rounded-md p-6 h-full">
      <div className="mb-3 flex justify-start">
        <p>{title}</p>
        <span className="text-primary text-sm">{subTitle}</span>
        {create && (
          <Button onClick={handleRedirect} className="w-[150px]">
            Crear usuario
            <CirclePlus />
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default AnalyticsCard;
