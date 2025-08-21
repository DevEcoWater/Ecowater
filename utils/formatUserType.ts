export const formatUserType = (userType: string): string => {
  switch (userType) {
    case "admin":
      return "Administrador";
    case "user":
      return "Usuario";
    case "supervisor":
      return "Supervisor";
  }
};
