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

export type MeterStatus = keyof typeof chipConfig;
