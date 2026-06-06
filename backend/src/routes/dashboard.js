const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Get dashboard stats — FIXED double-count logic
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('is_active', true);

    if (staffError) throw staffError;

    const { data: attendanceList, error: attError } = await supabase
      .from('attendance')
      .select('staff_id, status')
      .eq('date', today);

    if (attError) throw attError;

    const totalStaff = staffList.length;
    let present = 0;
    let onLunch = 0;
    let departed = 0;
    let absent = 0;
    let late = 0;

    // Build a set of staff IDs that have attendance records today
    const attendedStaffIds = new Set();
    attendanceList.forEach(record => {
      attendedStaffIds.add(record.staff_id);
      switch (record.status) {
        case 'present_morning':
        case 'present_afternoon':
        case 'present':
          present++;
          break;
        case 'on_lunch':
          onLunch++;
          break;
        case 'departed':
          departed++;
          break;
        case 'absent':
          absent++;
          break;
        default:
          break;
      }
    });

    // Staff not in attendance list at all are absent
    staffList.forEach(s => {
      if (!attendedStaffIds.has(s.id)) {
        absent++;
      }
    });

    res.json({
      total: totalStaff,
      present,
      onLunch,
      departed,
      absent,
      late,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent notifications for admin dashboard
router.get('/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
