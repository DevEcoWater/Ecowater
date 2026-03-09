export function getPageHeaderFromPath(pathname: string | null) {
  if (!pathname) return defaultHeader;

  const routes: { pattern: RegExp; title: string; description: string; tourName?: string }[] = [
    {
      pattern: /^\/dashboard$/,
      title: "Dashboard",
      description: "Panel de control principal - Monitoreo en tiempo real",
      tourName: "home-dashboard",
    },
    {
      pattern: /\/mapa/,
      title: "Mapa",
      description: "Visualice la ubicación de los medidores en el mapa",
    },
    {
      pattern: /\/usuarios\/[^/]+\/editar$/,
      title: "Editar Usuario",
      description: "Actualice la información del usuario y su ubicación",
      tourName: "user-edit",
    },
    {
      pattern: /\/usuarios\/[^/]+$/,
      title: "Detalle del Usuario",
      description: "Información detallada del cliente seleccionado",
      tourName: "user-detail",
    },
    {
      pattern: /\/usuarios\/registro/,
      title: "Registrar Usuario",
      description: "Complete el formulario para registrar un nuevo cliente",
    },
    {
      pattern: /\/usuarios$/,
      title: "Gestión de Usuarios",
      description: "Administre usuarios, registre nuevos clientes y actualice información.",
      tourName: "users-list",
    },
    {
      pattern: /\/medidores\/[^/]+$/,
      title: "Detalle del Medidor",
      description: "Información en tiempo real del medidor seleccionado",
      tourName: "meter-detail",
    },
    {
      pattern: /\/medidores$/,
      title: "Gestión de Medidores",
      description: "Visualice y edite la información de los medidores",
      tourName: "meters-list",
    },
    {
      pattern: /\/cooperativa/,
      title: "Gestión de Cooperativa",
      description: "Visualice y edite la información de la cooperativa",
    },
  ];

  for (const route of routes) {
    if (route.pattern.test(pathname)) {
      return {
        title: route.title,
        description: route.description,
        tourName: route.tourName ?? null,
      };
    }
  }

  return defaultHeader;
}

const defaultHeader = {
  title: "Gestión de Usuarios",
  description:
    "Administre usuarios, registre nuevos clientes y actualice información.",
  tourName: null,
};
