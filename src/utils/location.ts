export function getApproximateLocation(
  latitude: number,
  longitude: number
): string {
  const lat = Math.round(latitude * 100) / 100;
  const lng = Math.round(longitude * 100) / 100;
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "O";
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    const { reverseGeocodeAsync } = await import("expo-location");
    const results = await reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const r = results[0];
      return r.city || r.district || r.street || null;
    }
    return null;
  } catch {
    return null;
  }
}
