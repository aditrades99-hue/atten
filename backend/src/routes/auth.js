const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stafftrack_jwt_secret_dev';

/**
 * POST /api/auth/login
 * Validates admin credentials from .env and returns a JWT token.
 */
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  const kioskEmail = process.env.KIOSK_EMAIL || 'kiosk@maruti.com';
  const kioskPassword = process.env.KIOSK_PASSWORD || 'marutikiosk';

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ success: false, message: 'Server misconfiguration: admin credentials not set.' });
  }

  // Check Admin Login
  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign(
      { email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    return res.json({ success: true, token, user: { email, role: 'admin' } });
  }
  
  // Check Kiosk Login
  if (email === kioskEmail && password === kioskPassword) {
    const token = jwt.sign(
      { email, role: 'kiosk' },
      JWT_SECRET,
      { expiresIn: '365d' } // Long expiration for kiosk mode
    );
    return res.json({ success: true, token, user: { email, role: 'kiosk' } });
  }

  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

/**
 * POST /api/auth/verify
 * Verifies a JWT token and returns the decoded payload.
 */
router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ valid: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, message: 'Token expired or invalid' });
  }
});

module.exports = router;
