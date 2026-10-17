// Roles que pueden navegar parte del dashboard pero nunca modificar datos.
const READ_ONLY_ROLES = ["lector", "operario"];

/** true si el rol puede crear/editar/borrar en el dashboard (zonas, rutas, descargas…). */
export function canEditDashboard(role?: string | null): boolean {
  return !!role && !READ_ONLY_ROLES.includes(role);
}
