-- =========================================================================
-- HARDWARE REQUISITION MODULE DATABASE SCHEMA (V3 PRODUCTION)
-- =========================================================================

-- 1. INVENTORY CATEGORIES
CREATE TABLE IF NOT EXISTS inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Seed Default Categories
INSERT INTO inventory_categories (name, slug, description) VALUES 
('Microcontrollers', 'microcontrollers', 'Development boards, microcontrollers, and single-board computers'),
('Sensors', 'sensors', 'Environmental, distance, motion, and optical sensors'),
('Motors & Actuators', 'motors', 'Servo motors, stepper motors, DC motors, and motor drivers'),
('Power & Batteries', 'power', 'LiPo batteries, power supplies, voltage regulators, and chargers'),
('Mechanical & Structural', 'mechanical', 'Frames, chassis, gears, wheels, and structural hardware'),
('Communication Modules', 'communication', 'Wi-Fi, Bluetooth, LoRa, RF, and CAN bus modules'),
('Displays & LEDs', 'displays', 'OLED displays, LCD screens, and LED matrices'),
('Tools & Equipment', 'tools', 'Soldering stations, multimeters, hand tools, and testing gear'),
('Miscellaneous', 'miscellaneous', 'Wires, breadboards, connectors, and passive components')
ON CONFLICT (name) DO NOTHING;

-- 2. HARDWARE TABLE ENHANCEMENTS
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES inventory_categories(id);
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS "reservedQuantity" INTEGER DEFAULT 0;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS specs TEXT;
ALTER TABLE hardware ADD COLUMN IF NOT EXISTS manual_url TEXT;

-- 3. HARDWARE REQUESTS (Primary Order Table)
CREATE TABLE IF NOT EXISTS hardware_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    temp_request_id TEXT UNIQUE NOT NULL,
    final_requisition_id TEXT UNIQUE,
    user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
    user_name TEXT NOT NULL,
    member_id TEXT,
    roll_number TEXT,
    department TEXT,
    section TEXT,
    year TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    photo_url TEXT,
    project_title TEXT NOT NULL,
    project_desc TEXT NOT NULL,
    faculty_mentor TEXT,
    project_type TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    purpose TEXT NOT NULL,
    takeaway_date DATE NOT NULL,
    return_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'issued', 'returned', 'overdue')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMP WITH TIME ZONE,
    issued_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE
);

-- Index for checking duplicate pending requests fast
CREATE INDEX IF NOT EXISTS idx_hardware_requests_user_status ON hardware_requests(user_id, status);

-- 4. HARDWARE REQUEST ITEMS (Junction Table with Audit Snapshot)
CREATE TABLE IF NOT EXISTS hardware_request_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES hardware_requests(id) ON DELETE CASCADE NOT NULL,
    hardware_id UUID REFERENCES hardware(id) ON DELETE RESTRICT NOT NULL,
    hardware_name TEXT NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    available_at_request_time INTEGER NOT NULL DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. EXTENSION REQUESTS
CREATE TABLE IF NOT EXISTS extension_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES hardware_requests(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    new_requested_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 6. INVENTORY TRANSACTIONS AUDIT LOG
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hardware_id UUID REFERENCES hardware(id) ON DELETE CASCADE NOT NULL,
    request_id UUID REFERENCES hardware_requests(id) ON DELETE SET NULL,
    qty_change INTEGER NOT NULL,
    transaction_type TEXT CHECK (transaction_type IN ('reserve', 'issue', 'return', 'adjust')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. SEQUENTIAL REQUISITION ID TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION generate_final_requisition_id()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_seq INTEGER;
    formatted_id TEXT;
BEGIN
    -- Only generate when status changes to 'approved' and final_requisition_id is NULL
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') AND NEW.final_requisition_id IS NULL THEN
        year_prefix := to_char(CURRENT_DATE, 'YY');
        
        SELECT COALESCE(MAX(
            CAST(SUBSTRING(final_requisition_id FROM 'HR-[0-9]+-([0-9]+)') AS INTEGER)
        ), 0) + 1
        INTO next_seq
        FROM hardware_requests
        WHERE final_requisition_id LIKE 'HR-' || year_prefix || '-%';

        formatted_id := 'HR-' || year_prefix || '-' || LPAD(next_seq::text, 4, '0');
        NEW.final_requisition_id := formatted_id;
        NEW.approved_at := timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assign_requisition_id ON hardware_requests;
CREATE TRIGGER trigger_assign_requisition_id
BEFORE UPDATE ON hardware_requests
FOR EACH ROW
EXECUTE FUNCTION generate_final_requisition_id();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE hardware_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_requests ENABLE ROW LEVEL SECURITY;

-- Member Read Policy for hardware_requests
DROP POLICY IF EXISTS "Users can view their own requests or staff can view all" ON hardware_requests;
CREATE POLICY "Users can view their own requests or staff can view all" ON hardware_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_member_or_admin(auth.uid()));

-- Member Insert Policy for hardware_requests
DROP POLICY IF EXISTS "Users can insert their own requests" ON hardware_requests;
CREATE POLICY "Users can insert their own requests" ON hardware_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Staff Update Policy for hardware_requests
DROP POLICY IF EXISTS "Staff can update requests" ON hardware_requests;
CREATE POLICY "Staff can update requests" ON hardware_requests
FOR UPDATE TO authenticated
USING (public.is_member_or_admin(auth.uid()));

-- Request Items Policies
DROP POLICY IF EXISTS "Users and staff can view request items" ON hardware_request_items;
CREATE POLICY "Users and staff can view request items" ON hardware_request_items
FOR SELECT TO authenticated
USING (EXISTS (
    SELECT 1 FROM hardware_requests hr 
    WHERE hr.id = hardware_request_items.request_id 
    AND (hr.user_id = auth.uid() OR public.is_member_or_admin(auth.uid()))
));

DROP POLICY IF EXISTS "Users can insert request items" ON hardware_request_items;
CREATE POLICY "Users can insert request items" ON hardware_request_items
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM hardware_requests hr 
    WHERE hr.id = hardware_request_items.request_id 
    AND hr.user_id = auth.uid()
));

-- Extension Requests Policies
DROP POLICY IF EXISTS "Users can view and create extension requests" ON extension_requests;
CREATE POLICY "Users can view and create extension requests" ON extension_requests
FOR ALL TO authenticated
USING (auth.uid() = user_id OR public.is_member_or_admin(auth.uid()))
WITH CHECK (auth.uid() = user_id);
