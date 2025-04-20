export const chipConfig = {
  active: { backgroundColor: "#dcfce7", textColor: "#3a975c", label: "Activo" },
  inactive: {
    backgroundColor: "#FEECD4",
    textColor: "#F17A3D",
    label: "Alerta",
  },
  error: { backgroundColor: "#FEE2E1", textColor: "#DC3335", label: "Error" },
  default: { backgroundColor: "#dbeaff", textColor: "#5a88ee", label: "Total" },
};

export const userConfig = {
  ACTIVE: { backgroundColor: "#dcfce7", textColor: "#3a975c", label: "Activo" },
  INACTIVE: {
    backgroundColor: "#FEECD4",
    textColor: "#F17A3D",
    label: "Inactivo",
  },
  PENDING: {
    backgroundColor: "#FEE2E1",
    textColor: "#DC3335",
    label: "Pendiente",
  },
  BLOCKED: {
    backgroundColor: "#FEE2E1",
    textColor: "#DC3335",
    label: "Bloqueado",
  },
};

export type MeterStatus = keyof typeof chipConfig;

export type UserStatus = keyof typeof userConfig;
