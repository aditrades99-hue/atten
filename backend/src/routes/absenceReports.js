const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { sendNotification } = require('../services/telegram');

// Submit absence report (from kiosk)
router.post('/', async (req, res) => {
  try {
    const { reported_by, absent_staff_id, report_type, notes } = req.body;

    // Fetch names for notification
    const { data: staffData } = await supabase
      .from('staff')
      .select('id, name')
      .in('id', [reported_by, absent_staff_id]);

    let reporterName = 'Someone';
    let absentName = 'Unknown';

    if (staffData) {
      const reporter = staffData.find(s => s.id === reported_by);
      const absent = staffData.find(s => s.id === absent_staff_id);
      if (reporter) reporterName = reporter.name;
      if (absent) absentName = absent.name;
    }

    const { data, error } = await supabase
      .from('absence_reports')
      .insert([{ reported_by, absent_staff_id, report_type, notes }])
      .select();

    if (error) throw error;

    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const msg = `🚨 *Absence Report*\n*${absentName}* — ${report_type.replace(/_/g, ' ')}\nReported by: *${reporterName}* at *${timeStr}*`;

    await sendNotification(msg);

    // Notify admin dashboard
    await supabase.from('notifications').insert([{
      type: 'absence_report',
      title: 'New Absence Report',
      message: `Report filed for ${absentName} by ${reporterName}`,
      staff_id: absent_staff_id,
    }]);

    res.status(201).json({ success: true, report: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reports (for admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('absence_reports')
      .select(`
        *,
        reporter:staff!absence_reports_reported_by_fkey(name),
        absent_staff:staff!absence_reports_absent_staff_id_fkey(name)
      `)
      .order('report_time', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve report (admin)
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;

    const { data, error } = await supabase
      .from('absence_reports')
      .update({ is_resolved: true, admin_response })
      .eq('id', id)
      .select();

    if (error) throw error;
    res.json({ success: true, report: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
