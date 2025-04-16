export function getPageHeaderFromPath(pathname: string | null) {
  if (!pathname) return defaultHeader;

  const routes: { pattern: RegExp; title: string; description: string }[] = [
    {
      pattern: /\/usuarios\/editar\/[^/]+$/,
      title: "Editar Usuario",
      description: "Actualice la información del usuario y su ubicación",
    },
    {
      pattern: /\/usuarios\/detalle\/[^/]+$/,
      title: "Detalle del Usuario",
      description: "Información detallada del cliente seleccionado",
    },
    {
      pattern: /\/usuarios\/registro/,
      title: "Registrar Usuario",
      description: "Complete el formulario para registrar un nuevo cliente",
    },
  ];

  for (const route of routes) {
    if (route.pattern.test(pathname)) {
      return {
        title: route.title,
        description: route.description,
      };
    }
  }

  return defaultHeader;
}

const defaultHeader = {
  title: "Gestión de Usuarios",
  description:
    "Administre usuarios, registre nuevos clientes y actualice información.",
};
