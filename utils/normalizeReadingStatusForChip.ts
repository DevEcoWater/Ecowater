import { MeterStatus } from "@prisma/client";

export const normalizeStatus = (status: string): MeterStatus => {
  switch (status) {
    case "OPERATIVE":
    case "ACTIVE":
      return "ACTIVE";
    case "ERROR":
      return "FAULTY";
    case "NEEDS_MAINTENANCE":
      return "MAINTENANCE";
    case "DISABLED":
      return "INACTIVE";
    default:
      return "INACTIVE"; // fallback
  }
};
