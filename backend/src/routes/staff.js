const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Get all active staff
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new staff
router.post('/', async (req, res) => {
  try {
    const { name, role, phone, email, face_descriptor, photo_url } = req.body;
    
    const { data, error } = await supabase
      .from('staff')
      .insert([{ name, role, phone, email, face_descriptor, photo_url }])
      .select();
      
    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', id)
      .select();
      
    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate (delete) staff
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
