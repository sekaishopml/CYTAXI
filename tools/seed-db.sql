-- ===========================================
-- CYTAXI - Database Schema
-- ===========================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PASSENGERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- DRIVERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    vehicle_plate VARCHAR(20) NOT NULL,
    vehicle_brand VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    vehicle_color VARCHAR(30) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'van', 'motorcycle')),
    license_number VARCHAR(50) NOT NULL,
    insurance_number VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'busy', 'on_trip')),
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_trips INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- RIDES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES passengers(id),
    driver_id UUID REFERENCES drivers(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'requested', 'matched', 'accepted', 
        'arriving', 'in_progress', 'completed', 'cancelled'
    )),
    pickup_lat DECIMAL(10, 8) NOT NULL,
    pickup_lon DECIMAL(11, 8) NOT NULL,
    destination_lat DECIMAL(10, 8) NOT NULL,
    destination_lon DECIMAL(11, 8) NOT NULL,
    pickup_address TEXT,
    destination_address TEXT,
    fare DECIMAL(10, 2),
    distance DECIMAL(10, 2),
    duration INTEGER,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- RIDE EVENTS TABLE (for event sourcing)
-- ===========================================
CREATE TABLE IF NOT EXISTS ride_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID NOT NULL REFERENCES rides(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_rides_passenger ON rides(passenger_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST (
    ST_Point(pickup_lon, pickup_lat)
);
CREATE INDEX IF NOT EXISTS idx_ride_events_ride ON ride_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_events_type ON ride_events(event_type);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_passengers_updated_at
    BEFORE UPDATE ON passengers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rides_updated_at
    BEFORE UPDATE ON rides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED DATA (optional)
-- ===========================================

-- Insert a test passenger
INSERT INTO passengers (phone, name) VALUES 
    ('+593991234567', 'Pasajero Test')
ON CONFLICT (phone) DO NOTHING;

-- Insert test drivers
INSERT INTO drivers (name, phone, vehicle_plate, vehicle_brand, vehicle_model, vehicle_year, vehicle_color, vehicle_type, license_number, insurance_number) VALUES 
    ('Juan Pérez', '+593998765432', 'ABC-1234', 'Toyota', 'Corolla', 2020, 'Blanco', 'sedan', 'LIC-001', 'INS-001'),
    ('María García', '+593997654321', 'XYZ-5678', 'Hyundai', 'Tucson', 2021, 'Negro', 'suv', 'LIC-002', 'INS-002'),
    ('Carlos López', '+593996543210', 'DEF-9012', 'Kia', 'Rio', 2019, 'Rojo', 'sedan', 'LIC-003', 'INS-003')
ON CONFLICT (phone) DO NOTHING;

-- ===========================================
-- VIEWS
-- ===========================================

-- View for active rides with driver info
CREATE OR REPLACE VIEW active_rides AS
SELECT 
    r.id,
    r.status,
    r.pickup_lat,
    r.pickup_lon,
    r.destination_lat,
    r.destination_lon,
    r.pickup_address,
    r.destination_address,
    r.fare,
    r.distance,
    r.duration,
    r.created_at,
    p.phone as passenger_phone,
    p.name as passenger_name,
    d.name as driver_name,
    d.phone as driver_phone,
    d.vehicle_plate,
    d.vehicle_brand,
    d.vehicle_model
FROM rides r
LEFT JOIN passengers p ON r.passenger_id = p.id
LEFT JOIN drivers d ON r.driver_id = d.id
WHERE r.status IN ('requested', 'matched', 'accepted', 'arriving', 'in_progress')
ORDER BY r.created_at DESC;

-- View for driver statistics
CREATE OR REPLACE VIEW driver_stats AS
SELECT 
    d.id,
    d.name,
    d.phone,
    d.vehicle_plate,
    d.status,
    d.rating,
    d.total_trips,
    COUNT(r.id) as completed_rides,
    SUM(CASE WHEN r.status = 'completed' THEN r.fare ELSE 0 END) as total_earnings
FROM drivers d
LEFT JOIN rides r ON d.id = r.driver_id AND r.status = 'completed'
GROUP BY d.id, d.name, d.phone, d.vehicle_plate, d.status, d.rating, d.total_trips;
