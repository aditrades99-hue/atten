const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initScheduler } = require('./utils/scheduler');

const app = express();
const port = process.env.PORT || 3001;

// CORS — allow frontend dev server and production domains dynamically
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // larger limit for base64 face photos

// Device Authorization Guard Middleware
const deviceGuard = require('./middleware/deviceGuard');
app.use(deviceGuard);

// Routes
app.use('/api/devices', require('./routes/devices'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/events', require('./routes/events'));
app.use('/api/absence-reports', require('./routes/absenceReports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 StaffTrack Backend running on port ${port}`);
  initScheduler();
});
