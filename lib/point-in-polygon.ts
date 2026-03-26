export interface PolygonPoint {
  lat: number;
  lng: number;
}

/**
 * Ray casting algorithm — returns true if the point (lat, lng)
 * is inside the given polygon.
 */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: PolygonPoint[]
): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}
