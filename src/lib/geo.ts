/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Great-circle distance between two points, in kilometers (Haversine).
 */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371; // Earth radius (km)
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Human-friendly distance label in pt-BR (e.g. "850 m", "1,2 km").
 */
export function formatDistance(km: number): string {
  if (!isFinite(km) || km < 0) return '';
  if (km < 1) {
    const m = Math.round(km * 1000 / 10) * 10; // nearest 10 m
    return `${m} m`;
  }
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * Promise wrapper over the browser Geolocation API.
 */
export function getCurrentPosition(options?: PositionOptions): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocalização não é suportada neste navegador.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000, ...options }
    );
  });
}
