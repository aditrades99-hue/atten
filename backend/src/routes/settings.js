const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Get all settings
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
      
    if (error) throw error;
    
    // Convert array of {key, value} to single object
    const settingsObj = {};
    data.forEach(item => {
      settingsObj[item.key] = item.value;
    });
    
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.post('/', async (req, res) => {
  try {
    const settings = req.body;
    const updates = Object.keys(settings).map(key => ({
      key,
      value: String(settings[key]),
      updated_at: new Date().toISOString()
    }));
    
    // upsert settings
    const { error } = await supabase
      .from('settings')
      .upsert(updates);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
