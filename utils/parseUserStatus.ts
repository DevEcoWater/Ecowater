import { MeterStatus, UserStatus } from "@prisma/client";

export const parseChipStatus = (status: MeterStatus | UserStatus) => {
  switch (status) {
    case "ACTIVE":
      return { text: "Activo", style: "ACTIVE" };
    case "INACTIVE":
      return { text: "Inactivo", style: "INACTIVE" };
    case "PENDING":
      return { text: "Pendiente", style: "INACTIVE" };
    case "MAINTENANCE":
      return { text: "Revisar", style: "INACTIVE" };
    case "BLOCKED":
      return { text: "Bloqueado", style: "BLOCKED" };
    case "FAULTY":
      return { text: "Error", style: "ERROR" };
    default:
      return { text: status, style: "DEFAULT" };
  }
};

export const parseUserStatus = (status: string) => {
  switch (status) {
    case "activo":
      return "ACTIVE";
    case "inactivo":
      return "INACTIVE";
    case "pendiente":
      return "PENDING";
    case "bloqueado":
      return "BLOCKED";
    default:
      return "INACTIVE";
  }
};
