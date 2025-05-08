"use client";
import Link from "next/link";
import { Button } from "../ui/button";
import { CircleArrowLeft } from "lucide-react";

export const BackButton = ({
  href,
  label,
}: {
  href: () => void;
  label: string;
}) => {
  return (
    <Button
      asChild
      onClick={href}
      variant={"link"}
      className="font-medium w-auto justify-start my-4"
    >
      <CircleArrowLeft />
      {label}
    </Button>
  );
};
