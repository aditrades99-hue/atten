const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendNotification } = require('../services/telegram');

// Helper to get or create today's attendance record
async function getOrCreateAttendance(staffId) {
  const today = new Date().toISOString().split('T')[0];

  let { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', staffId)
    .eq('date', today);

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0];
  }

  const { data: newData, error: insertError } = await supabase
    .from('attendance')
    .insert([{ staff_id: staffId, date: today, status: 'absent' }])
    .select();

  if (insertError) throw insertError;
  return newData[0];
}

// Log event helper
async function logEvent(staffId, eventType, success = true, photoUrl = null) {
  await supabase.from('attendance_events').insert([{
    staff_id: staffId,
    event_type: eventType,
    verification_success: success,
    captured_photo_url: photoUrl,
  }]);
}

// Get all attendance for a date (default today)
router.get('/', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('*, staff(name, role, photo_url)')
      .eq('date', date);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark Action (arrived, lunch_out, lunch_return, departed)
router.post('/mark', async (req, res) => {
  try {
    const { staffId, action, photoUrl, verificationSuccess = true } = req.body;

    // Fetch staff name for notifications
    const { data: staffData } = await supabase.from('staff').select('name').eq('id', staffId).single();
    const staffName = staffData?.name || 'Staff';

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (!verificationSuccess) {
      await logEvent(staffId, 'verification_failed', false, photoUrl);
      await sendNotification(`⚠️ Verification *FAILED* for *${staffName}* at *${timeStr}*`);
      return res.status(403).json({ success: false, message: 'Verification failed' });
    }

    const attendance = await getOrCreateAttendance(staffId);
    let updateData = {};
    let status = '';
    let msg = '';

    switch (action) {
      case 'arrived':
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
      case 'departed':
        let totalHours = null;
        if (attendance.morning_arrival) {
          const morningDiff = (attendance.lunch_departure ? new Date(attendance.lunch_departure) : now) - new Date(attendance.morning_arrival);
          const afternoonDiff = (attendance.lunch_return && attendance.lunch_departure) ? (now - new Date(attendance.lunch_return)) : 0;
          totalHours = (morningDiff + afternoonDiff) / (1000 * 60 * 60);
        }
        updateData = {
          evening_departure: now.toISOString(),
          status: 'departed',
          total_hours: totalHours ? totalHours.toFixed(2) : null,
        };
        status = 'departed';
        msg = `🏠 *${staffName}* departed at *${timeStr}*` + (totalHours ? ` | Total: *${totalHours.toFixed(1)} hrs*` : '');
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Update attendance record
    const { error: updateError } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', attendance.id);

    if (updateError) throw updateError;

    // Log success event
    await logEvent(staffId, action, true, photoUrl);

    // Send Telegram notification
    await sendNotification(msg);

    // In-app notification
    await supabase.from('notifications').insert([{
      type: action,
      title: `${staffName} ${action.replace('_', ' ')}`,
      message: msg.replace(/[*]/g, '').trim(),
      staff_id: staffId,
    }]);

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
