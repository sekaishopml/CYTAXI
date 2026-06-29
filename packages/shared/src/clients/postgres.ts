import postgres from 'postgres';

export class PostgresClient {
  private sql: ReturnType<typeof postgres>;
  private static instance: PostgresClient;

  private constructor(connectionString: string) {
    this.sql = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  static getInstance(connectionString?: string): PostgresClient {
    if (!PostgresClient.instance) {
      const connStr = connectionString || process.env.DATABASE_URL || 'postgresql://cytaxi:cytaxi_secret@localhost:5433/cytaxi';
      PostgresClient.instance = new PostgresClient(connStr);
    }
    return PostgresClient.instance;
  }

  getSql() {
    return this.sql;
  }

  // ===========================================
  // RIDE OPERATIONS
  // ===========================================

  async createRide(ride: {
    id: string;
    passengerId: string;
    pickupLat: number;
    pickupLon: number;
    destinationLat: number;
    destinationLon: number;
    pickupAddress?: string;
    destinationAddress?: string;
  }) {
    const [result] = await this.sql`
      INSERT INTO rides (id, passenger_id, pickup_lat, pickup_lon, destination_lat, destination_lon, pickup_address, destination_address, status)
      VALUES (${ride.id}, ${ride.passengerId}, ${ride.pickupLat}, ${ride.pickupLon}, ${ride.destinationLat}, ${ride.destinationLon}, ${ride.pickupAddress || null}, ${ride.destinationAddress || null}, 'requested')
      RETURNING *
    `;
    return result;
  }

  async getRideById(id: string) {
    const [ride] = await this.sql`
      SELECT * FROM rides WHERE id = ${id}
    `;
    return ride;
  }

  async updateRideStatus(id: string, status: string, driverId?: string) {
    const update: Record<string, unknown> = { status, updated_at: new Date() };
    if (driverId) update.driver_id = driverId;

    const [result] = await this.sql`
      UPDATE rides
      SET status = ${status},
          driver_id = COALESCE(${driverId || null}, driver_id),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result;
  }

  async getActiveRides() {
    const rides = await this.sql`
      SELECT * FROM rides
      WHERE status IN ('requested', 'matched', 'accepted', 'arriving', 'in_progress')
      ORDER BY created_at DESC
    `;
    return rides;
  }

  // ===========================================
  // DRIVER OPERATIONS
  // ===========================================

  async createDriver(driver: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    vehiclePlate: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    vehicleColor: string;
    vehicleType: string;
    licenseNumber: string;
    insuranceNumber: string;
  }) {
    const [result] = await this.sql`
      INSERT INTO drivers (id, name, phone, email, vehicle_plate, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_type, license_number, insurance_number, status)
      VALUES (${driver.id}, ${driver.name}, ${driver.phone}, ${driver.email || null}, ${driver.vehiclePlate}, ${driver.vehicleBrand}, ${driver.vehicleModel}, ${driver.vehicleYear}, ${driver.vehicleColor}, ${driver.vehicleType}, ${driver.licenseNumber}, ${driver.insuranceNumber}, 'offline')
      RETURNING *
    `;
    return result;
  }

  async getDriverById(id: string) {
    const [driver] = await this.sql`
      SELECT * FROM drivers WHERE id = ${id}
    `;
    return driver;
  }

  async updateDriverStatus(id: string, status: string) {
    const [result] = await this.sql`
      UPDATE drivers
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result;
  }

  async getAvailableDrivers() {
    const drivers = await this.sql`
      SELECT * FROM drivers
      WHERE status = 'online'
      ORDER BY rating DESC
    `;
    return drivers;
  }

  // ===========================================
  // PASSENGER OPERATIONS
  // ===========================================

  async getOrCreatePassenger(phone: string, name?: string) {
    let [passenger] = await this.sql`
      SELECT * FROM passengers WHERE phone = ${phone}
    `;

    if (!passenger) {
      [passenger] = await this.sql`
        INSERT INTO passengers (id, phone, name)
        VALUES (gen_random_uuid(), ${phone}, ${name || null})
        RETURNING *
      `;
    }

    return passenger;
  }

  async close(): Promise<void> {
    await this.sql.end();
    console.log('🔌 PostgreSQL connection closed');
  }
}

export const db = PostgresClient.getInstance();
