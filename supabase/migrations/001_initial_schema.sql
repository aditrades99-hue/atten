-- Staff profiles
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  face_descriptor JSONB,        -- stored face embedding vector
  photo_url TEXT,               -- reference photo URL
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance records
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_arrival TIMESTAMPTZ,
  lunch_departure TIMESTAMPTZ,
  lunch_return TIMESTAMPTZ,
  evening_departure TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'absent',  -- absent | present | on_lunch | departed
  total_hours DECIMAL(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event log (every face-scan action)
CREATE TABLE attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  event_type VARCHAR(30) NOT NULL,  -- arrived | lunch_out | lunch_return | departed | verification_failed
  timestamp TIMESTAMPTZ DEFAULT now(),
  verification_success BOOLEAN,
  captured_photo_url TEXT,          -- photo taken during scan
  confidence_score DECIMAL(5,4),    -- face match confidence
  device_info TEXT,
  notes TEXT
);

-- Absence reports (staff reporting about colleagues)
CREATE TABLE absence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES staff(id),
  absent_staff_id UUID REFERENCES staff(id),
  report_type VARCHAR(30),   -- morning_no_show | lunch_no_return | early_leave
  report_time TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  is_resolved BOOLEAN DEFAULT false,
  admin_response TEXT
);

-- Notifications log
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50),
  title TEXT,
  message TEXT,
  staff_id UUID REFERENCES staff(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin settings
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
