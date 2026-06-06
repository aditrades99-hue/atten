# StaffTrack — Face-Verified Attendance & Monitoring System
### Complete App Plan for Claude Code Implementation

---

## 1. PROJECT OVERVIEW

**App Name:** StaffTrack  
**Type:** Progressive Web App (PWA) — works in browser, installable on mobile  
**Purpose:** Shop/business staff attendance tracking with real-time face verification, WhatsApp alerts, and admin oversight  
**Target Users:** Small business owners with shop staff (2–20 employees)

---

## 2. CORE CONCEPT SUMMARY

A **dual-login web app** where:
- **Staff Kiosk Mode** — opened on shop laptop/tablet; staff tap their name, face scan verifies identity, marks Present/Lunch Out/Back from Lunch/Departed
- **Admin Dashboard** — accessed from admin's phone or any device; receives real-time pop-up notifications, full attendance logs, reports, and staff absence alerts

All events trigger:
1. In-app popup notification (both logins)
2. Direct WhatsApp message to admin's number via WhatsApp Business API / wa.me link automation
3. Database log with timestamp and captured photo

---

## 3. TECH STACK (Recommended for Claude Code)

### Backend
```
Runtime:        Node.js (Express.js)
Database:       PostgreSQL (via Supabase — free tier, realtime built-in)
Auth:           Supabase Auth (email/password + session management)
Face Detection: face-api.js (runs in browser — no server GPU needed)
                OR Python FastAPI microservice with DeepFace library
File Storage:   Supabase Storage (for face reference photos + violation snapshots)
Realtime:       Supabase Realtime (WebSocket — instant admin notifications)
WhatsApp:       Twilio WhatsApp API (or CallMeBot free API as fallback)
Notifications:  Web Push API (via web-push npm package)
Hosting:        Railway.app or Render.com (free tier works)
```

### Frontend
```
Framework:      React (Vite)
Styling:        Tailwind CSS + shadcn/ui components
Camera:         WebRTC getUserMedia API
Face AI:        face-api.js (TensorFlow.js models — runs client-side)
State:          Zustand
Realtime:       Supabase JS client (realtime subscriptions)
PWA:            Vite PWA plugin (installable, works offline for kiosk)
```

### Alternative Simpler Stack (if Claude Code prefers)
```
Full-stack:     Next.js 14 (App Router)
Database:       Supabase (Postgres + Realtime + Auth + Storage)
Face API:       face-api.js client-side
Deployment:     Vercel (free)
```

---

## 4. DATABASE SCHEMA

```sql
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
-- Keys: whatsapp_number, shop_name, work_start_time, lunch_start_time,
--       lunch_end_time, work_end_time, late_threshold_minutes
```

---

## 5. APPLICATION PAGES & ROUTES

### 5A. KIOSK (Staff) Side — `/kiosk`

```
/kiosk                    — Kiosk home: staff name grid
/kiosk/verify/:staffId    — Face verification screen
/kiosk/success            — Success confirmation screen
```

### 5B. ADMIN Side — `/admin`

```
/admin/login              — Admin login page
/admin/dashboard          — Live dashboard with today's status
/admin/attendance         — Full attendance records + filters
/admin/staff              — Staff management (add/edit/delete)
/admin/staff/add          — Add new staff + upload face photo
/admin/absence-reports    — View absence reports filed by staff
/admin/events             — Full event log with photos
/admin/settings           — Shop settings, WhatsApp number, work timings
/admin/reports            — Weekly/monthly reports, export CSV
```

---

## 6. FEATURE-BY-FEATURE SPECIFICATION

---

### FEATURE 1: KIOSK HOMEPAGE (Staff Grid)

**What it shows:**
- Shop logo + current date/time (live clock)
- Grid of staff cards — each showing: photo thumbnail, name, current status badge
  - 🟢 Present | 🟡 On Lunch | 🔴 Absent | ⬛ Departed
- Each staff card has action buttons based on current status:
  - If Absent → **[Mark Arrived]**
  - If Present → **[Going for Lunch]**
  - If On Lunch → **[Back from Lunch]**
  - If Present (after lunch) → **[Mark Departed]**
- A **"Report Absence"** button (bottom of page) for staff to report a colleague

**On page load:**
- Browser asks permission for Camera and Notifications (required)
- If denied — show persistent banner explaining why it's mandatory

---

### FEATURE 2: FACE VERIFICATION FLOW

**Trigger:** Staff clicks any attendance action button

**Step-by-step flow:**

1. **Verification Modal Opens**
   - Shows: "Hello [Name]! Please look at the camera"
   - Countdown: 3... 2... 1... (animated)
   - Camera feed appears (using `getUserMedia`)

2. **Face Detection** (using face-api.js client-side)
   - Load pre-trained models: `ssdMobilenetv1`, `faceLandmark68Net`, `faceRecognitionNet`
   - Detect face in camera feed
   - Extract 128-dimension face descriptor

3. **Matching**
   - Compare live descriptor with stored descriptor from DB (loaded on kiosk init)
   - If distance < 0.5 (configurable threshold) → **MATCH ✅**
   - If distance ≥ 0.5 → **MISMATCH ❌**

4. **On Success:**
   - Record event in DB with timestamp
   - Show animated success screen: "✅ Welcome, [Name]! Time: 09:02 AM"
   - Auto-dismiss after 4 seconds, return to grid
   - Trigger: in-app notification + WhatsApp message to admin

5. **On Failure:**
   - Capture current camera frame as photo
   - Upload photo to Supabase Storage
   - Record failed event in DB
   - Send WhatsApp to admin: "⚠️ Verification FAILED while feeding attendance of [Name]. [Photo link]"
   - Show error screen: "❌ Face not recognized. Please try again or contact admin."
   - Log to notifications table

---

### FEATURE 3: ATTENDANCE STATES & DAILY FLOW

Each staff per day goes through this state machine:

```
ABSENT (default)
  → [Mark Arrived] + face verify → PRESENT (logs morning_arrival time)
  → [Going for Lunch] + face verify → ON_LUNCH (logs lunch_departure time)
  → [Back from Lunch] + face verify → PRESENT (logs lunch_return time)
  → [Mark Departed] + face verify → DEPARTED (logs evening_departure time)
```

**Computed fields (auto-calculated):**
- **Morning hours** = lunch_departure - morning_arrival
- **Afternoon hours** = evening_departure - lunch_return
- **Total hours** = morning hours + afternoon hours
- **Late arrival flag** = morning_arrival > shop work_start_time + late_threshold

---

### FEATURE 4: ADMIN DASHBOARD

**Live Dashboard Cards:**
- Total Staff | Present Today | On Lunch | Absent | Departed
- Live feed of recent events (auto-updates via Supabase Realtime)
- Color-coded staff status grid (same as kiosk but view-only)
- Late arrivals highlighted in orange
- Unresolved absence reports badge

**In-App Notifications (Admin):**
- Bell icon with unread count
- Pop-up toast in bottom-right for every new event
- Events: arrived, lunch out, lunch return, departed, verification failed, absence report filed
- Notification stays until dismissed or marked read

**Notification Center:**
- List of all notifications with timestamps
- Filter: All | Unread | Verification Failures | Absence Reports
- Click notification → goes to relevant staff's record

---

### FEATURE 5: WHATSAPP NOTIFICATIONS

**Method:** Use CallMeBot API (free, no approval needed) OR Twilio WhatsApp Business API

**CallMeBot Setup (Simpler):**
```
URL: https://api.callmebot.com/whatsapp.php?phone=+977XXXXXXXXXX&text=MESSAGE&apikey=YOUR_KEY
```
Staff registers once on callmebot.com to get API key. Then every event hits this URL.

**Message Templates:**

| Event | Message |
|---|---|
| Morning Arrival | ✅ *[Name]* arrived at *09:02 AM* |
| Lunch Departure | 🍱 *[Name]* left for lunch at *1:05 PM* |
| Lunch Return | 🔙 *[Name]* returned from lunch at *2:10 PM* |
| Evening Departure | 🏠 *[Name]* departed at *6:30 PM* |
| Verification Failed | ⚠️ Face verification FAILED for *[Name]* at *10:45 AM*. Photo: [link] |
| Absence Report | 🚨 Staff report: *[Name]* has not arrived by *10:00 AM*. Reported by *[Reporter]* |
| Late Arrival | ⏰ *[Name]* arrived LATE at *9:47 AM* (scheduled: 9:00 AM) |

**Important:** All WhatsApp messages sent server-side (Node.js backend calls the API) — no client-side permission needed. Silent, automatic, private.

---

### FEATURE 6: ABSENCE REPORT PAGE (Staff Side)

**Access:** "Report Absence" button on kiosk home

**What it does:**
Staff can report:
- A colleague has **not arrived by morning** (e.g., it's 10:30 AM and [Name] hasn't come)
- A colleague **has not returned from lunch**
- Any concern report with free-text notes

**Form Fields:**
- Who is reporting (their own name — dropdown)
- Who they are reporting about (dropdown of absent/unaccounted staff)
- Report type: Morning No-Show | Lunch No-Return | Other
- Notes (optional, free text)
- Submit button

**On Submit:**
- Record saved in `absence_reports` table
- In-app notification sent to admin
- WhatsApp sent to admin: "🚨 Absence Report: [Absent Name] has not [arrived/returned from lunch]. Reported by [Reporter] at 10:32 AM"
- Confirmation shown to reporter: "Your report has been sent to admin ✅"

**Admin can:**
- View all reports
- Mark as Resolved with a response note
- This is visible in the absence_reports page

---

### FEATURE 7: STAFF MANAGEMENT (Admin)

**Add New Staff:**
- Name, Role, Phone, Email
- Upload face photo (or take live photo via webcam)
- System runs face-api.js on uploaded photo → extracts descriptor → stores in DB
- Multiple photos recommended (3–5 angles for accuracy)

**Edit Staff:**
- Update details
- Re-upload face photo
- Deactivate/reactivate staff

**Face Registration:**
- Admin uploads 3–5 photos of staff member
- System extracts face descriptors from each
- Stores average descriptor + all individual descriptors for better matching accuracy

---

### FEATURE 8: REPORTS & EXPORT

**Attendance Report Page:**
- Date range picker
- Filter by staff
- Table: Name | Date | Arrived | Lunch Out | Lunch Return | Departed | Total Hours | Status
- Color coding: Late = orange, Absent = red, Full day = green
- **Export to CSV** button
- **Monthly summary:** total days present, average hours, late count

---

### FEATURE 9: SETTINGS PAGE (Admin)

| Setting | Description |
|---|---|
| Shop Name | Displayed on kiosk |
| WhatsApp Number | Admin's number for all alerts (+977...) |
| CallMeBot API Key | For WhatsApp delivery |
| Work Start Time | e.g., 09:00 AM |
| Lunch Start Window | e.g., 12:00 PM – 2:00 PM |
| Work End Time | e.g., 6:00 PM |
| Late Threshold (mins) | e.g., 15 mins grace period |
| Face Match Threshold | 0.0–1.0 (default 0.5, lower = stricter) |
| Camera Permission Reminder | Toggle reminder banner on kiosk |

---

## 7. ADDITIONAL FEATURES (Recommended)

### 7A. Auto-Absent Mark
- A scheduled job (cron) runs at end of day (e.g., 7 PM)
- Marks any still-absent staff as "Absent" for the day
- Sends daily summary WhatsApp to admin

### 7B. Daily Summary WhatsApp (End of Day)
```
📊 Daily Summary — 3 June 2026
Present: Ravi, Sita, Hari (3/5)
Absent: Kiran, Mina (2/5)
Late arrivals: Hari (+22 mins)
Total avg hours: 7.8 hrs
```

### 7C. Weekly Report (Monday Morning)
Auto-sends weekly attendance summary every Monday at 9 AM

### 7D. Overtime Tracker
- If staff works beyond work_end_time, flag as overtime
- Track overtime hours separately in reports

### 7E. Manual Override (Admin)
- Admin can manually edit any attendance record (with reason note)
- All manual edits are logged separately as "admin_override" events

### 7F. Staff Self-View (Optional)
- Staff can view their own attendance on a separate read-only page
- Accessed via personal PIN or simple staff login

### 7G. Holiday/Leave Management
- Admin can mark specific days as public holidays
- Admin can approve leave requests (staff submits, admin approves)
- Leave days excluded from absent count in reports

### 7H. Break Monitoring
- Multiple breaks allowed per day (not just lunch)
- Each break start/end requires face verification
- Tracks total break time

### 7I. Kiosk Lock Mode
- Kiosk page auto-locks when idle for 60 seconds
- Shows screensaver with clock and shop name
- Prevents unauthorized use of the browser

### 7J. Two-Factor Verification
- For high-security mode: staff must also enter a 4-digit PIN after face scan
- Optional per-staff setting

---

## 8. SECURITY CONSIDERATIONS

1. **Kiosk login** — separate session type, very limited permissions (read staff list, write events only)
2. **Admin login** — full access, JWT with 24hr expiry, refresh tokens
3. **Face data** — stored as numeric vectors (not photos), cannot reverse-engineer a face from them
4. **Violation photos** — stored in private Supabase Storage bucket, only accessible via signed URLs
5. **WhatsApp API key** — stored in backend .env, never exposed to client
6. **Rate limiting** — max 5 verification attempts per staff per 10 minutes
7. **HTTPS only** — required for camera access and PWA

---

## 9. FOLDER STRUCTURE (for Claude Code)

```
stafftrack/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── staff.js
│   │   │   ├── attendance.js
│   │   │   ├── events.js
│   │   │   ├── reports.js
│   │   │   ├── absenceReports.js
│   │   │   └── settings.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── rateLimit.js
│   │   ├── services/
│   │   │   ├── whatsapp.js       ← CallMeBot integration
│   │   │   ├── notifications.js  ← Web Push
│   │   │   └── faceStorage.js    ← Supabase Storage
│   │   ├── utils/
│   │   │   └── scheduler.js      ← Daily summary cron
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── kiosk/
│   │   │   │   ├── KioskHome.jsx        ← Staff grid
│   │   │   │   ├── FaceVerify.jsx       ← Camera + face-api.js
│   │   │   │   ├── VerifySuccess.jsx
│   │   │   │   ├── VerifyFailed.jsx
│   │   │   │   └── AbsenceReport.jsx
│   │   │   └── admin/
│   │   │       ├── Login.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Attendance.jsx
│   │   │       ├── StaffList.jsx
│   │   │       ├── AddStaff.jsx
│   │   │       ├── AbsenceReports.jsx
│   │   │       ├── EventLog.jsx
│   │   │       ├── Reports.jsx
│   │   │       └── Settings.jsx
│   │   ├── components/
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ToastNotification.jsx
│   │   │   ├── StaffCard.jsx
│   │   │   ├── CameraModal.jsx
│   │   │   └── FaceLoader.jsx
│   │   ├── hooks/
│   │   │   ├── useFaceApi.js
│   │   │   ├── useRealtimeNotifs.js
│   │   │   └── useCamera.js
│   │   ├── store/
│   │   │   └── useStore.js        ← Zustand
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── faceapi.js
│   │   └── App.jsx
│   ├── public/
│   │   └── models/               ← face-api.js model files
│   ├── vite.config.js
│   └── package.json
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
└── README.md
```

---

## 10. ENVIRONMENT VARIABLES (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# WhatsApp (CallMeBot)
WHATSAPP_ADMIN_NUMBER=+977XXXXXXXXXX
CALLMEBOT_API_KEY=your_key_here

# OR Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# App
PORT=3001
ADMIN_EMAIL=admin@yourshop.com
ADMIN_PASSWORD_HASH=bcrypt_hash
JWT_SECRET=random_secret_here
FRONTEND_URL=https://yourapp.vercel.app

# Face Recognition
FACE_MATCH_THRESHOLD=0.5
```

---

## 11. WHATSAPP SETUP INSTRUCTIONS

### Option A: CallMeBot (Free, Easiest)
1. Save +34 644 597 902 in your phone as "CallMeBot"
2. Send this WhatsApp message to that number: `I allow callmebot to send me messages`
3. You'll receive an API key back
4. Add your number + API key to .env
5. Done — no approval, no payment

### Option B: Twilio (More Reliable, Paid)
1. Create Twilio account at twilio.com
2. Activate WhatsApp Sandbox
3. Have admin WhatsApp the sandbox join code
4. Use Twilio credentials in .env

---

## 12. DEPLOYMENT INSTRUCTIONS (for Claude Code)

```bash
# 1. Create Supabase project at supabase.com
# 2. Run SQL migrations in Supabase SQL editor
# 3. Deploy backend to Railway:
railway login
railway new
railway up

# 4. Deploy frontend to Vercel:
vercel --prod

# 5. Set environment variables in Railway + Vercel dashboards
# 6. Set kiosk URL as homepage on shop laptop browser
# 7. Add admin URL to admin's phone homescreen (PWA install)
```

---

## 13. UI DESIGN DIRECTION

**Aesthetic:** Industrial-clean with status-driven color language  
**Kiosk Theme:** Dark background (#0D0D0D), large readable cards, bold status colors  
**Admin Theme:** Clean light panel, data-dense but uncluttered, sidebar nav  
**Fonts:** Display: "Syne" (bold, modern) + Body: "DM Mono" (technical feel)  
**Colors:**
- Present Green: `#22C55E`
- Lunch Amber: `#F59E0B`
- Absent Red: `#EF4444`
- Departed Slate: `#64748B`
- Accent Blue: `#3B82F6`
- Background Dark: `#0F172A`
- Background Light: `#F8FAFC`

**Animations:**
- Face scan: pulsing ring animation around camera view
- Success: green checkmark with scale-in pop
- Failure: red X with shake animation
- Notifications: slide-in from right
- Status cards: smooth color transition on update

---

## 14. CLAUDE CODE PROMPT (Copy-Paste Ready)

```
Build a full-stack web application called StaffTrack — a face-verified staff 
attendance system for a small shop.

TECH STACK:
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: Supabase (PostgreSQL + Realtime + Storage)
- Face Recognition: face-api.js (client-side, TensorFlow.js)
- WhatsApp Alerts: CallMeBot API
- Auth: Supabase Auth

IMPLEMENT THESE FEATURES IN ORDER:

1. DATABASE: Run the SQL schema (staff, attendance, attendance_events, 
   absence_reports, notifications, settings tables)

2. KIOSK PAGE (/kiosk):
   - Grid of staff cards with name, photo, status badge
   - Action buttons per status (Arrived/Lunch Out/Back/Departed)
   - On button click → open camera modal → face scan with face-api.js
   - Match face against stored descriptor (loaded from DB on page load)
   - Success: record event, show success screen, trigger WhatsApp + notification
   - Failure: capture photo, upload to Supabase Storage, send WhatsApp with photo link
   - Request camera + notification permissions on load

3. ADMIN DASHBOARD (/admin):
   - Login page with email/password
   - Dashboard with live stats cards + realtime event feed (Supabase Realtime)
   - Staff management (add/edit with face photo upload + descriptor extraction)
   - Attendance records table with date/staff filters
   - Absence reports viewer
   - Settings page (WhatsApp number, work hours, thresholds)
   - Notification bell with unread count and toast popups

4. ABSENCE REPORT PAGE (on kiosk):
   - Staff selects who is missing and report type
   - Sends to admin via in-app notification + WhatsApp

5. WHATSAPP SERVICE (backend):
   - Node.js service calling CallMeBot API
   - Triggered by all events: arrival, lunch, departure, failed verification, 
     absence reports, daily summary

6. SCHEDULED JOBS:
   - End of day: mark remaining absent staff, send daily summary WhatsApp
   - Monday: send weekly summary

DESIGN:
- Kiosk: dark theme (#0F172A), large touch-friendly cards, Syne + DM Mono fonts
- Admin: clean light panel, sidebar navigation, data tables
- Animations: face scan pulsing ring, success/failure screen animations
- All screens fully responsive and mobile-friendly

Use environment variables for all secrets. Include a README with setup instructions.
```

---

## 15. ESTIMATED DEVELOPMENT TIME

| Phase | Task | Hours |
|---|---|---|
| 1 | DB schema + Supabase setup | 2 hrs |
| 2 | Backend API routes | 4 hrs |
| 3 | Kiosk UI + face-api.js integration | 6 hrs |
| 4 | Admin dashboard + realtime | 5 hrs |
| 5 | WhatsApp service + notifications | 2 hrs |
| 6 | Staff management + face upload | 3 hrs |
| 7 | Reports + export | 2 hrs |
| 8 | Absence report feature | 1.5 hrs |
| 9 | Scheduled jobs | 1 hr |
| 10 | PWA config + deployment | 1.5 hrs |
| **Total** | | **~28 hrs** |

---

*Document prepared for: StaffTrack — Face-Verified Attendance System*  
*Version 1.0 | Ready for Claude Code implementation*
