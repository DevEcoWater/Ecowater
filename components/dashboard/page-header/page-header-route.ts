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
      tourName: "map",
    },
    {
      // Antes que /usuarios/[id]: si no, "nuevo" se toma como un id de usuario
      pattern: /\/usuarios\/nuevo$/,
      title: "Crear Usuario",
      description: "Complete el formulario para registrar un nuevo usuario",
      tourName: "user-create",
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
      pattern: /\/usuarios$/,
      title: "Gestión de Usuarios",
      description: "Administre usuarios, registre nuevos clientes y actualice información.",
      tourName: "users-list",
    },
    {
      pattern: /\/medidores\/mecanicos\/nuevo$/,
      title: "Nuevo Medidor Mecánico",
      description: "Registrá un medidor de lectura manual en el sistema.",
      tourName: "mechanical-meter-form",
    },
    {
      pattern: /\/medidores\/mecanicos\/[^/]+\/editar$/,
      title: "Editar Medidor Mecánico",
      description: "Actualizá los datos y la ubicación del medidor de lectura manual.",
      tourName: "mechanical-meter-form",
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
      tourName: "cooperative",
    },
    {
      pattern: /\/zonas\/[^/]+\/ruta$/,
      title: "Ruta de Lectura",
      description: "Asigná los medidores mecánicos de la zona a cada operario",
      tourName: "zone-route",
    },
    {
      pattern: /\/zonas\/[^/]+$/,
      title: "Detalle de Zona",
      description: "Medidores dentro de esta área geográfica",
      tourName: "zone-detail",
    },
    {
      pattern: /\/zonas$/,
      title: "Zonas",
      description: "Áreas geográficas definidas sobre el mapa",
      tourName: "zones-list",
    },
    {
      pattern: /\/operarios\/nuevo/,
      title: "Nuevo Operario",
      description: "Registrá un nuevo operario de campo en el sistema",
      tourName: "operario-create",
    },
    {
      pattern: /\/operarios\/[^/]+$/,
      title: "Detalle del Operario",
      description: "Perfil, zonas asignadas e historial de lecturas del operario",
      tourName: "operario-detail",
    },
    {
      pattern: /\/operarios$/,
      title: "Operarios",
      description: "Gestión de operarios de campo y sus zonas asignadas",
      tourName: "operarios-list",
    },
    {
      pattern: /\/portal\/zonas\/[^/]+\/medidores\/[^/]+$/,
      title: "Registrar Lectura",
      description: "Ingresá el valor del medidor y guardá la lectura",
      tourName: "portal-reading",
    },
    {
      pattern: /\/portal\/zonas\/[^/]+$/,
      title: "Ruta de Lectura",
      description: "Medidores pendientes de lectura en esta zona",
      tourName: "portal-route",
    },
    {
      pattern: /\/portal\/zonas$/,
      title: "Mis Zonas",
      description: "Zonas asignadas para la ronda de lectura de hoy",
      tourName: "portal-zones",
    },
    {
      pattern: /^\/portal$/,
      title: "Portal Operario",
      description: "Resumen de tu jornada de lectura",
      tourName: "portal-home",
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
  title: "Dashboard",
  description: "Panel de control principal",
  tourName: null,
};
