// Texto que hay que escribir para confirmar el borrado de un medidor:
// su nombre, o "ELIMINAR" si no tiene.
export function getDeleteConfirmText(deviceName?: string | null) {
  return deviceName?.trim() || "ELIMINAR";
}
