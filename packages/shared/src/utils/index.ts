export function generateId(): string {
  return crypto.randomUUID();
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function calculateFare(distanceKm: number, durationMinutes: number): number {
  const baseFare = parseFloat(process.env.BASE_FARE || '1.50');
  const perKmRate = parseFloat(process.env.PER_KM_RATE || '0.50');
  const perMinuteRate = parseFloat(process.env.PER_MINUTE_RATE || '0.10');
  const minimumFare = parseFloat(process.env.MINIMUM_FARE || '2.50');

  const fare = baseFare + distanceKm * perKmRate + durationMinutes * perMinuteRate;
  return Math.max(fare, minimumFare);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('593')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('9')) {
    return `+593${cleaned}`;
  }
  return `+${cleaned}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function sanitizeAddress(address: string): string {
  return address
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,-]/g, '');
}
