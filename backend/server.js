const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/students');
const templateRoutes = require('./src/routes/templates');
const instanceRoutes = require('./src/routes/instances');
const boardRoutes = require('./src/routes/board');
const attendanceRoutes = require('./src/routes/asistencias');
const billingRoutes = require('./src/routes/billing');
const paymentRoutes = require('./src/routes/pagos');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  })
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/instances', instanceRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/asistencias', attendanceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/pagos', paymentRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
