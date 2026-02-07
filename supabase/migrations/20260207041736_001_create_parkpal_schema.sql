/*
  # PARKPAL Complete Database Schema
  
  1. Core Tables
    - users (base user table)
    - parking_locations (parking facilities)
    - parking_slots (individual parking spaces)
    - bookings (parking reservations)
    - payments (payment transactions)
    - reviews (user reviews for parkings)
  
  2. Relationships
    - User → ParkingLocation (owner relationship)
    - ParkingLocation → ParkingSlots (one-to-many)
    - User → Bookings (customer relationship)
    - Bookings → Payments (one-to-one)
    - User → Reviews (reviewer relationship)
  
  3. Security
    - RLS enabled on all tables
    - Role-based access control (user, owner, admin)
    - Proper authentication checks
*/

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
  is_active boolean DEFAULT true,
  is_blocked boolean DEFAULT false,
  avatar_url text,
  rating numeric(3,2) DEFAULT 5.00,
  total_bookings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- Parking locations table
CREATE TABLE IF NOT EXISTS parking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text,
  zip_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  total_slots integer NOT NULL DEFAULT 0,
  available_slots integer NOT NULL DEFAULT 0,
  price_per_hour numeric(10,2) NOT NULL,
  description text,
  amenities jsonb DEFAULT '[]'::jsonb,
  operating_hours jsonb DEFAULT '{"open": "06:00", "close": "23:00"}'::jsonb,
  is_approved boolean DEFAULT false,
  is_active boolean DEFAULT true,
  average_rating numeric(3,2) DEFAULT 5.00,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_price CHECK (price_per_hour > 0),
  CONSTRAINT valid_slots CHECK (total_slots > 0)
);

-- Parking slots table
CREATE TABLE IF NOT EXISTS parking_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parking_location_id uuid NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
  slot_number text NOT NULL,
  slot_type text DEFAULT 'standard' CHECK (slot_type IN ('standard', 'compact', 'premium', 'handicap')),
  is_available boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(parking_location_id, slot_number)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_location_id uuid NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES parking_slots(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_duration numeric(10,2) NOT NULL,
  total_cost numeric(10,2) NOT NULL,
  vehicle_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_times CHECK (end_time > start_time),
  CONSTRAINT valid_cost CHECK (total_cost > 0)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  payment_method text DEFAULT 'card' CHECK (payment_method IN ('card', 'wallet', 'upi')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  transaction_id text UNIQUE,
  payment_gateway text DEFAULT 'simulated',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parking_location_id uuid NOT NULL REFERENCES parking_locations(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_parking_city ON parking_locations(city);
CREATE INDEX IF NOT EXISTS idx_parking_owner ON parking_locations(owner_id);
CREATE INDEX IF NOT EXISTS idx_slots_parking ON parking_slots(parking_location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking ON bookings(parking_location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_parking ON reviews(parking_location_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========

-- USERS TABLE POLICIES
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid()::text::uuid AND role = 'admin'
  ));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id AND role IN (
    SELECT role FROM users WHERE auth_id = auth.uid()
  ));

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update user status"
  ON users FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- PARKING_LOCATIONS TABLE POLICIES
CREATE POLICY "Everyone can view approved parking locations"
  ON parking_locations FOR SELECT
  USING (is_approved = true OR owner_id = auth.uid()::text::uuid);

CREATE POLICY "Owners can view their own parkings"
  ON parking_locations FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid()::text::uuid);

CREATE POLICY "Owners can create parking locations"
  ON parking_locations FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid()::text::uuid AND EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Owners can update their own parkings"
  ON parking_locations FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid()::text::uuid)
  WITH CHECK (owner_id = auth.uid()::text::uuid);

CREATE POLICY "Admins can approve parkings"
  ON parking_locations FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- PARKING_SLOTS TABLE POLICIES
CREATE POLICY "Everyone can view slots of approved parkings"
  ON parking_slots FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM parking_locations 
    WHERE id = parking_location_id AND is_approved = true
  ) OR EXISTS (
    SELECT 1 FROM parking_locations 
    WHERE id = parking_location_id AND owner_id = auth.uid()::text::uuid
  ));

CREATE POLICY "Owners can manage slots for their parkings"
  ON parking_slots FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parking_locations 
    WHERE id = parking_location_id AND owner_id = auth.uid()::text::uuid
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM parking_locations 
    WHERE id = parking_location_id AND owner_id = auth.uid()::text::uuid
  ));

-- BOOKINGS TABLE POLICIES
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text::uuid);

CREATE POLICY "Owners can view bookings for their parkings"
  ON bookings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM parking_locations 
    WHERE id = parking_location_id AND owner_id = auth.uid()::text::uuid
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text::uuid AND EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'user' AND is_active = true AND is_blocked = false
  ));

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text::uuid)
  WITH CHECK (user_id = auth.uid()::text::uuid);

CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'admin'
  ));

-- PAYMENTS TABLE POLICIES
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text::uuid);

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text::uuid AND EXISTS (
    SELECT 1 FROM bookings WHERE id = booking_id AND user_id = auth.uid()::text::uuid
  ));

CREATE POLICY "Users can update their own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text::uuid)
  WITH CHECK (user_id = auth.uid()::text::uuid);

-- REVIEWS TABLE POLICIES
CREATE POLICY "Everyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text::uuid AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = booking_id AND user_id = auth.uid()::text::uuid AND status = 'completed'
  ));

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text::uuid)
  WITH CHECK (user_id = auth.uid()::text::uuid);
