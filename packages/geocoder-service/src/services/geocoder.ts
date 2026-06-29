import { redis } from '@cytaxi/shared';
import { config } from '../config';

interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
  address: Record<string, string>;
}

export const geocoder = {
  async geocode(address: string): Promise<GeocodeResult | null> {
    // Verificar caché primero
    const cached = await redis.getCachedGeocode(address);
    if (cached) {
      console.log(`📦 Cache hit para: ${address}`);
      return {
        lat: cached.lat,
        lon: cached.lon,
        displayName: address,
        address: {},
      };
    }

    console.log(`🌐 Geocodificando: ${address}`);

    try {
      const url = `${config.nominatim.baseUrl}/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': config.nominatim.userAgent,
        },
      });

      if (!response.ok) {
        console.error(`❌ Error de Nominatim: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        console.log(`❌ No se encontraron resultados para: ${address}`);
        return null;
      }

      const result = data[0];
      const geocodeResult: GeocodeResult = {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        displayName: result.display_name,
        address: result.address || {},
      };

      // Guardar en caché
      await redis.cacheGeocode(address, geocodeResult.lat, geocodeResult.lon);

      console.log(`✅ Geocodificado: ${address} → ${geocodeResult.lat}, ${geocodeResult.lon}`);

      return geocodeResult;
    } catch (error) {
      console.error(`❌ Error al geocodificar:`, error);
      return null;
    }
  },

  async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<{ displayName: string; address: Record<string, string> } | null> {
    console.log(`🌐 Reverse geocoding: ${lat}, ${lon}`);

    try {
      const url = `${config.nominatim.baseUrl}/reverse?lat=${lat}&lon=${lon}&format=json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': config.nominatim.userAgent,
        },
      });

      if (!response.ok) {
        console.error(`❌ Error de Nominatim: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data) {
        return null;
      }

      console.log(`✅ Reverse geocoded: ${data.display_name}`);

      return {
        displayName: data.display_name,
        address: data.address || {},
      };
    } catch (error) {
      console.error(`❌ Error al hacer reverse geocoding:`, error);
      return null;
    }
  },
};
