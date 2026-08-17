export type Coordinates = { latitude: number; longitude: number };

export type NearbyStore = {
  id: string;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
};

function distanceKm(origin: Coordinates, destination: Coordinates) {
  const radius = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = toRadians(destination.latitude - origin.latitude);
  const deltaLongitude = toRadians(destination.longitude - origin.longitude);
  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(toRadians(origin.latitude)) * Math.cos(toRadians(destination.latitude))
    * Math.sin(deltaLongitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findNearbySupermarkets(origin: Coordinates, radius = 5000): Promise<NearbyStore[]> {
  const query = `[out:json][timeout:20];(node["shop"="supermarket"](around:${radius},${origin.latitude},${origin.longitude});way["shop"="supermarket"](around:${radius},${origin.latitude},${origin.longitude});relation["shop"="supermarket"](around:${radius},${origin.latitude},${origin.longitude}););out center tags;`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeout));
  if (!response.ok) throw new Error("No se pudieron consultar los comercios cercanos.");
  const data = await response.json() as { elements?: Array<{ id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }> };

  return (data.elements ?? []).flatMap((element) => {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (latitude === undefined || longitude === undefined) return [];
    const name = element.tags?.name ?? element.tags?.brand ?? "Supermercado";
    return [{
      id: String(element.id),
      name,
      brand: element.tags?.brand ?? name,
      latitude,
      longitude,
      distanceKm: distanceKm(origin, { latitude, longitude }),
    }];
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 30);
}
