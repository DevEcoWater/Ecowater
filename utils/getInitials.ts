export function getInitials(firstName: string, lastName: string): string {
  const first = firstName?.split(" ")[0] || "";
  const last = lastName?.split(" ")[0] || "";

  return `${first.charAt(0).toUpperCase()}${last.charAt(0).toUpperCase()}`;
}
