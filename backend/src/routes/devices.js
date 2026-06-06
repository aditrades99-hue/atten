const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const crypto = require('crypto');

const DEVICE_PASSCODE = process.env.DEVICE_PASSCODE || 'marutidevice2024';

const DEFAULT_DEVICES = [];

// Helper to get or initialize authorized devices from DB settings table
async function getAuthorizedDevices() {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'authorized_devices')
      .single();
      
    if (error || !data) {
      await supabase
        .from('settings')
        .upsert({ key: 'authorized_devices', value: JSON.stringify(DEFAULT_DEVICES) });
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
  } catch (err) {
    console.error('Error fetching authorized devices:', err);
    return DEFAULT_DEVICES;
  }
}

// Helper to save authorized devices back to DB
async function saveAuthorizedDevices(devices) {
  await supabase
    .from('settings')
    .upsert({ key: 'authorized_devices', value: JSON.stringify(devices) });
}

// 1. Get status of device
router.get('/status', async (req, res) => {
  const devices = await getAuthorizedDevices();
  const clientToken = req.headers['x-device-token'];
  
  // Check if current device is already registered
  const isRegistered = clientToken && devices.includes(clientToken);
  
  res.json({ currentDeviceAuthorized: !!isRegistered });
});

// 2. Register a device
router.post('/register', async (req, res) => {
  const { passcode } = req.body;
  
  if (passcode !== DEVICE_PASSCODE) {
    return res.status(400).json({ error: 'गलत पासवर्ड (Invalid Passcode)' });
  }
  
  const devices = await getAuthorizedDevices();
  
  // Register device
  const token = crypto.randomUUID();
  devices.push(token);
  
  await saveAuthorizedDevices(devices);
  
  res.json({ success: true, token });
});

// 3. Clear/Deregister all devices (Admin or API trigger)
router.post('/deregister', async (req, res) => {
  await saveAuthorizedDevices([]);
  res.json({ success: true, message: 'All devices cleared successfully' });
});

module.exports = router;
