const supabase = require('../lib/supabase');

async function deviceGuard(req, res, next) {
  // Allow health check and device routes through without a device token
  // Note: req.path here is the FULL original URL path (before Express route stripping)
  const fullPath = req.originalUrl || req.path;
  
  if (fullPath === '/api/health' || fullPath.startsWith('/api/devices')) {
    return next();
  }
  
  const token = req.headers['x-device-token'];
  
  if (!token) {
    return res.status(403).json({ error: 'Device not authorized', deviceBlocked: true });
  }
  
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'authorized_devices')
      .single();
      
    if (!data) {
      return res.status(403).json({ error: 'Device not authorized', deviceBlocked: true });
    }
    
    const devices = JSON.parse(data.value);
    
    let isValid = false;
    if (devices.length > 0 && typeof devices[0] === 'object') {
      isValid = devices.some(d => d.registered && d.token === token);
    } else {
      isValid = devices.includes(token);
    }
    
    if (!isValid) {
      return res.status(403).json({ error: 'Device not authorized', deviceBlocked: true });
    }
    
    next();
  } catch (err) {
    console.error('Device validation error:', err);
    return res.status(500).json({ error: 'Internal server error validating device' });
  }
}

module.exports = deviceGuard;
