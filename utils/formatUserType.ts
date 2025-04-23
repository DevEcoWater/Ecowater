export const formatUserType = (userType: string): string => {
  switch (userType) {
    case "user":
      return "Usuario";
    case "supervisor":
      return "Supervisor";
  }
};
