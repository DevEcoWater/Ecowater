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
