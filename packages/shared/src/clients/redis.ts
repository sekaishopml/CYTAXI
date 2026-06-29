import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;
  private static instance: RedisClient;

  private constructor(url: string = process.env.REDIS_URL || 'redis://localhost:6380') {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    this.client.on('error', (error) => {
      console.error('❌ Redis error:', error);
    });
  }

  static getInstance(url?: string): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(url);
    }
    return RedisClient.instance;
  }

  getClient(): Redis {
    return this.client;
  }

  // ===========================================
  // GEO OPERATIONS
  // ===========================================

  async addDriverLocation(
    driverId: string,
    lat: number,
    lon: number
  ): Promise<void> {
    await this.client.geoadd('driver:locations', lon, lat, driverId);
  }

  async getNearbyDrivers(
    lat: number,
    lon: number,
    radiusKm: number = 5
  ): Promise<Array<{ id: string; distance: number; lat: number; lon: number }>> {
    const results = await this.client.geosearch(
      'driver:locations',
      'FROMLONLAT',
      lon,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
      'COUNT',
      10,
      'WITHCOORD',
      'WITHDIST'
    );

    return results.map((result) => ({
      id: result.member,
      distance: parseFloat(result.dist || '0'),
      lon: result.coord?.x || 0,
      lat: result.coord?.y || 0,
    }));
  }

  async removeDriverLocation(driverId: string): Promise<void> {
    await this.client.zrem('driver:locations', driverId);
  }

  // ===========================================
  // CACHE OPERATIONS
  // ===========================================

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  // ===========================================
  // GEOCODING CACHE
  // ===========================================

  async cacheGeocode(address: string, lat: number, lon: number): Promise<void> {
    const key = `geocode:${address.toLowerCase()}`;
    await this.set(key, { lat, lon }, 86400); // 24 hours
  }

  async getCachedGeocode(address: string): Promise<{ lat: number; lon: number } | null> {
    const key = `geocode:${address.toLowerCase()}`;
    return this.get<{ lat: number; lon: number }>(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
    console.log('🔌 Redis connection closed');
  }
}

export const redis = RedisClient.getInstance();
