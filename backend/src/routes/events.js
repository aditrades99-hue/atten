const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Get recent events for dashboard
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const { data, error } = await supabase
      .from('attendance_events')
      .select('*, staff(name)')
      .order('timestamp', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
