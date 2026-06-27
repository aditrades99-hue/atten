import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ─── Supabase Client ────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Config ─────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'stafftrack_jwt_secret_dev';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const KIOSK_EMAIL = process.env.KIOSK_EMAIL || 'kiosk@maruti.com';
const KIOSK_PASSWORD = process.env.KIOSK_PASSWORD || 'marutikiosk';
const DEVICE_PASSCODE = process.env.DEVICE_PASSCODE || 'marutidevice2024';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEFAULT_DEVICES = [];

// ─── Helpers ────────────────────────────────────────────────────────
function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

async function sendTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'Markdown' }),
    });
  } catch (e) {
    console.error('Telegram error:', e.message);
  }
}

async function getAuthorizedDevices() {
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'authorized_devices').single();
    if (error || !data) {
      await supabase.from('settings').upsert({ key: 'authorized_devices', value: JSON.stringify(DEFAULT_DEVICES) });
      return DEFAULT_DEVICES;
    }
    const devices = JSON.parse(data.value);
    // Migration from old format: if it contains objects, map to tokens
    if (devices.length > 0 && typeof devices[0] === 'object') {
      const tokens = devices.filter(d => d.registered && d.token).map(d => d.token);
      await saveAuthorizedDevices(tokens);
      return tokens;
    }
    return devices;
  } catch { return DEFAULT_DEVICES; }
}

async function saveAuthorizedDevices(devices) {
  await supabase.from('settings').upsert({ key: 'authorized_devices', value: JSON.stringify(devices) });
}

// Device guard check
async function checkDevice(headers, path) {
  if (path === '/api/health' || path.startsWith('/api/devices')) return null;
  const token = headers.get('x-device-token');
  if (!token) return json(403, { error: 'Device not authorized', deviceBlocked: true });
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'authorized_devices').single();
    if (!data) return json(403, { error: 'Device not authorized', deviceBlocked: true });
    const devices = JSON.parse(data.value);
    let isValid = false;
    if (devices.length > 0 && typeof devices[0] === 'object') {
      isValid = devices.some(d => d.registered && d.token === token);
    } else {
      isValid = devices.includes(token);
    }
    if (!isValid) return json(403, { error: 'Device not authorized', deviceBlocked: true });
  } catch {
    return json(500, { error: 'Internal server error validating device' });
  }
  return null;
}

async function getOrCreateAttendance(staffId) {
  const today = new Date().toISOString().split('T')[0];
  let { data, error } = await supabase.from('attendance').select('*').eq('staff_id', staffId).eq('date', today);
  if (error) throw error;
  if (data && data.length > 0) return data[0];
  const { data: newData, error: insertError } = await supabase.from('attendance').insert([{ staff_id: staffId, date: today, status: 'absent' }]).select();
  if (insertError) throw insertError;
  return newData[0];
}

// ─── Route handlers ─────────────────────────────────────────────────

// AUTH
async function handleAuth(method, subPath, body) {
  if (method === 'POST' && subPath === '/login') {
    const { email, password } = body;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return json(500, { success: false, message: 'Server misconfiguration: admin credentials not set.' });
    }
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
      return json(200, { success: true, token, user: { email, role: 'admin' } });
    }
    if (email === KIOSK_EMAIL && password === KIOSK_PASSWORD) {
      const token = jwt.sign({ email, role: 'kiosk' }, JWT_SECRET, { expiresIn: '365d' });
      return json(200, { success: true, token, user: { email, role: 'kiosk' } });
    }
    return json(401, { success: false, message: 'Invalid credentials' });
  }
  if (method === 'POST' && subPath === '/verify') {
    const { token } = body;
    if (!token) return json(400, { valid: false });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return json(200, { valid: true, user: decoded });
    } catch {
      return json(401, { valid: false, message: 'Token expired or invalid' });
    }
  }
  return json(404, { error: 'Not found' });
}

// STAFF
async function handleStaff(method, subPath, body) {
  try {
    if (method === 'GET' && (subPath === '' || subPath === '/')) {
      const { data, error } = await supabase.from('staff').select('*').eq('is_active', true).order('name', { ascending: true });
      if (error) throw error;
      return json(200, data);
    }
    if (method === 'POST' && (subPath === '' || subPath === '/')) {
      const { name, role, phone, email, face_descriptor, photo_url } = body;
      const { data, error } = await supabase.from('staff').insert([{ name, role, phone, email, face_descriptor, photo_url }]).select();
      if (error) throw error;
      return json(201, data[0]);
    }
    // PUT or DELETE /staff/:id
    const idMatch = subPath.match(/^\/([^/]+)$/);
    if (method === 'PUT' && idMatch) {
      const id = idMatch[1];
      const { data, error } = await supabase.from('staff').update(body).eq('id', id).select();
      if (error) throw error;
      return json(200, data[0]);
    }
    if (method === 'DELETE' && idMatch) {
      const id = idMatch[1];
      const { error } = await supabase.from('staff').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return json(200, { success: true });
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// ATTENDANCE
async function handleAttendance(method, subPath, body, searchParams) {
  try {
    if (method === 'GET' && (subPath === '' || subPath === '/')) {
      const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
      
      const { data: staffList, error: staffError } = await supabase.from('staff').select('id, name, role, photo_url').eq('is_active', true);
      if (staffError) throw staffError;
      
      const { data, error } = await supabase.from('attendance').select('*').eq('date', date);
      if (error) throw error;
      
      const merged = staffList.map(staff => {
        const att = (data || []).find(a => a.staff_id === staff.id);
        if (att) {
          return { ...att, staff };
        } else {
          return {
            id: `no-att-${staff.id}`, staff_id: staff.id, date: date, status: 'absent',
            morning_arrival: null, lunch_departure: null, lunch_return: null, evening_departure: null, total_hours: null, staff: staff
          };
        }
      });
      return json(200, merged);
    }
    if (method === 'GET' && subPath === '/monthly') {
      const staffId = searchParams.get('staff_id');
      const startDate = searchParams.get('start_date');
      const endDate = searchParams.get('end_date');
      if (!staffId || !startDate || !endDate) return json(400, { error: 'staff_id, start_date, and end_date required' });
      
      const { data, error } = await supabase.from('attendance').select('*').eq('staff_id', staffId).gte('date', startDate).lte('date', endDate).order('date', { ascending: true });
      if (error) throw error;
      
      const records = [];
      const currDate = new Date(startDate);
      const lastDate = new Date(endDate);
      
      while (currDate <= lastDate) {
        const dateStr = currDate.toISOString().split('T')[0];
        const existing = (data || []).find(d => d.date === dateStr);
        if (existing) {
          records.push(existing);
        } else {
          records.push({
            id: `no-att-${dateStr}`, staff_id: staffId, date: dateStr, status: 'absent',
            morning_arrival: null, lunch_departure: null, lunch_return: null, evening_departure: null, total_hours: null
          });
        }
        currDate.setDate(currDate.getDate() + 1);
      }
      return json(200, records);
    }
    if (method === 'POST' && subPath === '/archive-staff') {
      const { staffId, start_date, end_date, pdfBase64, fileName, staffName } = body;
      if (!staffId || !start_date || !end_date || !pdfBase64) return json(400, { error: 'Missing required fields' });

      // Send to Telegram
      if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        try {
          const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
          const buffer = Buffer.from(base64Data, 'base64');
          const formData = new FormData();
          formData.append('chat_id', TELEGRAM_CHAT_ID);
          formData.append('document', new Blob([buffer], { type: 'application/pdf' }), fileName || `report_${staffId}_${start_date}.pdf`);
          formData.append('caption', `📁 *Monthly Report*\nStaff: *${staffName || staffId}*\nDates: *${start_date} to ${end_date}*`);

          const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData,
          });

          if (!tgRes.ok) throw new Error(await tgRes.text());
        } catch (e) {
          console.error('Telegram PDF send error:', e);
          return json(500, { error: 'Failed to send to Telegram', details: e.message });
        }
      }

      return json(200, { success: true, message: 'Report sent successfully' });
    }
    if (method === 'POST' && subPath === '/mark') {
      const { staffId, action, photoUrl, verificationSuccess = true } = body;
      const { data: staffData } = await supabase.from('staff').select('name').eq('id', staffId).single();
      const staffName = staffData?.name || 'Staff';
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      if (!verificationSuccess) {
        await supabase.from('attendance_events').insert([{ staff_id: staffId, event_type: 'verification_failed', verification_success: false, captured_photo_url: photoUrl }]);
        await sendTelegram(`⚠️ Verification *FAILED* for *${staffName}* at *${timeStr}*`);
        return json(403, { success: false, message: 'Verification failed' });
      }

      const attendance = await getOrCreateAttendance(staffId);
      let updateData = {};
      let status = '';
      let msg = '';

      switch (action) {
        case 'arrived':
          if (attendance.morning_arrival) {
            return json(400, { success: false, message: 'तपाईंले आजको लागि पहिले नै आगमन (Agman) गरिसक्नुभएको छ। (Already marked agman for today)' });
          }
          updateData = { morning_arrival: now.toISOString(), status: 'present_morning' };
          status = 'present_morning';
          msg = `✅ *${staffName}* arrived at *${timeStr}*`;
          break;
        case 'lunch_out':
          updateData = { lunch_departure: now.toISOString(), status: 'on_lunch' };
          status = 'on_lunch';
          msg = `🍱 *${staffName}* left for lunch at *${timeStr}*`;
          break;
        case 'lunch_return':
          updateData = { lunch_return: now.toISOString(), status: 'present_afternoon' };
          status = 'present_afternoon';
          msg = `🔙 *${staffName}* returned from lunch at *${timeStr}*`;
          break;
        case 'departed': {
          if (attendance.evening_departure) {
            return json(400, { success: false, message: 'तपाईंले आजको लागि पहिले नै प्रस्थान (Prasthan) गरिसक्नुभएको छ। (Already marked prasthan for today)' });
          }
          let totalHours = null;
          if (attendance.morning_arrival) {
            const morningDiff = (attendance.lunch_departure ? new Date(attendance.lunch_departure) : now) - new Date(attendance.morning_arrival);
            const afternoonDiff = (attendance.lunch_return && attendance.lunch_departure) ? (now - new Date(attendance.lunch_return)) : 0;
            totalHours = (morningDiff + afternoonDiff) / (1000 * 60 * 60);
          }
          updateData = { evening_departure: now.toISOString(), status: 'departed', total_hours: totalHours ? totalHours.toFixed(2) : null };
          status = 'departed';
          msg = `🏠 *${staffName}* departed at *${timeStr}*` + (totalHours ? ` | Total: *${totalHours.toFixed(1)} hrs*` : '');
          break;
        }
        default:
          return json(400, { error: 'Invalid action' });
      }

      const { error: updateError } = await supabase.from('attendance').update(updateData).eq('id', attendance.id);
      if (updateError) throw updateError;

      await supabase.from('attendance_events').insert([{ staff_id: staffId, event_type: action, verification_success: true, captured_photo_url: photoUrl }]);
      await sendTelegram(msg);
      await supabase.from('notifications').insert([{ type: action, title: `${staffName} ${action.replace('_', ' ')}`, message: msg.replace(/[*]/g, '').trim(), staff_id: staffId }]);

      return json(200, { success: true, status });
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// DASHBOARD
async function handleDashboard(method, subPath, searchParams) {
  try {
    if (method === 'GET' && subPath === '/stats') {
      const today = new Date().toISOString().split('T')[0];
      const { data: staffList, error: staffError } = await supabase.from('staff').select('id').eq('is_active', true);
      if (staffError) throw staffError;
      const { data: attendanceList, error: attError } = await supabase.from('attendance').select('staff_id, status').eq('date', today);
      if (attError) throw attError;

      const totalStaff = staffList.length;
      let present = 0, onLunch = 0, departed = 0, absent = 0, late = 0;
      const attendedStaffIds = new Set();

      (attendanceList || []).forEach(record => {
        attendedStaffIds.add(record.staff_id);
        switch (record.status) {
          case 'present_morning': case 'present_afternoon': case 'present': present++; break;
          case 'on_lunch': onLunch++; break;
          case 'departed': departed++; break;
          case 'absent': absent++; break;
        }
      });

      staffList.forEach(s => { if (!attendedStaffIds.has(s.id)) absent++; });
      return json(200, { total: totalStaff, present, onLunch, departed, absent, late });
    }
    if (method === 'GET' && subPath === '/notifications') {
      const limit = parseInt(searchParams.get('limit') || '20');
      const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return json(200, data || []);
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// EVENTS
async function handleEvents(method, subPath, searchParams) {
  try {
    if (method === 'GET' && (subPath === '' || subPath === '/')) {
      const limit = parseInt(searchParams.get('limit') || '20');
      const { data, error } = await supabase.from('attendance_events').select('*, staff(name)').order('timestamp', { ascending: false }).limit(limit);
      if (error) throw error;
      return json(200, data);
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// ABSENCE REPORTS
async function handleAbsenceReports(method, subPath, body) {
  try {
    if (method === 'POST' && (subPath === '' || subPath === '/')) {
      const { reported_by, absent_staff_id, report_type, notes } = body;
      const { data: staffData } = await supabase.from('staff').select('id, name').in('id', [reported_by, absent_staff_id]);
      let reporterName = 'Someone', absentName = 'Unknown';
      if (staffData) {
        const reporter = staffData.find(s => s.id === reported_by);
        const absent = staffData.find(s => s.id === absent_staff_id);
        if (reporter) reporterName = reporter.name;
        if (absent) absentName = absent.name;
      }
      const { data, error } = await supabase.from('absence_reports').insert([{ reported_by, absent_staff_id, report_type, notes }]).select();
      if (error) throw error;
      const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      await sendTelegram(`🚨 *Absence Report*\n*${absentName}* — ${report_type.replace(/_/g, ' ')}\nReported by: *${reporterName}* at *${timeStr}*`);
      await supabase.from('notifications').insert([{ type: 'absence_report', title: 'New Absence Report', message: `Report filed for ${absentName} by ${reporterName}`, staff_id: absent_staff_id }]);
      return json(201, { success: true, report: data[0] });
    }
    if (method === 'GET' && (subPath === '' || subPath === '/')) {
      const { data, error } = await supabase.from('absence_reports').select(`*, reporter:staff!absence_reports_reported_by_fkey(name), absent_staff:staff!absence_reports_absent_staff_id_fkey(name)`).order('report_time', { ascending: false });
      if (error) throw error;
      return json(200, data || []);
    }
    // PUT /absence-reports/:id/resolve
    const resolveMatch = subPath.match(/^\/([^/]+)\/resolve$/);
    if (method === 'PUT' && resolveMatch) {
      const id = resolveMatch[1];
      const { admin_response } = body;
      const { data, error } = await supabase.from('absence_reports').update({ is_resolved: true, admin_response }).eq('id', id).select();
      if (error) throw error;
      return json(200, { success: true, report: data[0] });
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// SETTINGS
async function handleSettings(method, subPath, body) {
  try {
    if (method === 'GET' && (subPath === '' || subPath === '/')) {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const settingsObj = {};
      data.forEach(item => { settingsObj[item.key] = item.value; });
      return json(200, settingsObj);
    }
    if (method === 'POST' && (subPath === '' || subPath === '/')) {
      const updates = Object.keys(body).map(key => ({ key, value: String(body[key]), updated_at: new Date().toISOString() }));
      const { error } = await supabase.from('settings').upsert(updates);
      if (error) throw error;
      return json(200, { success: true });
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// DEVICES
async function handleDevices(method, subPath, body, headers) {
  try {
    if (method === 'GET' && subPath === '/status') {
      const devices = await getAuthorizedDevices();
      const clientToken = headers.get('x-device-token');
      const isRegistered = clientToken && devices.includes(clientToken);
      return json(200, { currentDeviceAuthorized: !!isRegistered });
    }
    if (method === 'POST' && subPath === '/register') {
      const { passcode } = body;
      if (passcode !== DEVICE_PASSCODE) {
        return json(400, { error: 'गलत पासवर्ड (Invalid Passcode)' });
      }
      const devices = await getAuthorizedDevices();
      const token = crypto.randomUUID();
      devices.push(token);
      await saveAuthorizedDevices(devices);
      return json(200, { success: true, token });
    }
    if (method === 'POST' && subPath === '/deregister') {
      // Clear all devices
      await saveAuthorizedDevices([]);
      return json(200, { success: true, message: 'All devices cleared successfully' });
    }
  } catch (error) {
    return json(500, { error: error.message });
  }
  return json(404, { error: 'Not found' });
}

// ─── Main Handler ───────────────────────────────────────────────────
export default async (req, context) => {
  const url = new URL(req.url);
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-Token',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
    });
  }

  // Parse the path — Netlify rewrites /api/* to /.netlify/functions/api/*
  // The actual path can be the original /api/... path
  let path = url.pathname;
  
  // If path starts with /.netlify/functions/api, strip that prefix to get the /api/... path
  if (path.startsWith('/.netlify/functions/api')) {
    path = path.replace('/.netlify/functions/api', '/api');
  }

  // Parse body for non-GET methods
  let body = {};
  if (method !== 'GET' && method !== 'HEAD') {
    try { body = await req.json(); } catch { body = {}; }
  }

  // Health check
  if (path === '/api/health') {
    return json(200, { status: 'ok', time: new Date().toISOString() });
  }

  // Device guard (skip for devices and health)
  const deviceBlock = await checkDevice(req.headers, path);
  if (deviceBlock) return deviceBlock;

  // Route to handlers
  if (path.startsWith('/api/auth')) {
    const subPath = path.replace('/api/auth', '') || '/';
    return handleAuth(method, subPath, body);
  }
  if (path.startsWith('/api/staff')) {
    const subPath = path.replace('/api/staff', '');
    return handleStaff(method, subPath, body);
  }
  if (path.startsWith('/api/attendance')) {
    const subPath = path.replace('/api/attendance', '');
    return handleAttendance(method, subPath, body, url.searchParams);
  }
  if (path.startsWith('/api/dashboard')) {
    const subPath = path.replace('/api/dashboard', '');
    return handleDashboard(method, subPath, url.searchParams);
  }
  if (path.startsWith('/api/events')) {
    const subPath = path.replace('/api/events', '');
    return handleEvents(method, subPath, url.searchParams);
  }
  if (path.startsWith('/api/absence-reports')) {
    const subPath = path.replace('/api/absence-reports', '');
    return handleAbsenceReports(method, subPath, body);
  }
  if (path.startsWith('/api/settings')) {
    const subPath = path.replace('/api/settings', '');
    return handleSettings(method, subPath, body);
  }
  if (path.startsWith('/api/devices')) {
    const subPath = path.replace('/api/devices', '');
    return handleDevices(method, subPath, body, req.headers);
  }

  return json(404, { error: 'API route not found' });
};

export const config = {
  path: "/api/*"
};
