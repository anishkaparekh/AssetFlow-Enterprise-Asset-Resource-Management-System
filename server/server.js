const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.error('Failed to set DNS servers:', e);
}
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const allocationsRoutes = require('./routes/allocations');
const bookingsRoutes = require('./routes/bookings');
const transfersRoutes = require('./routes/transfers');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/allocations', allocationsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/transfers', transfersRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', service: 'AssetFlow API', timestamp: new Date() });
});

// Root fallback route
app.get('/', (req, res) => {
  res.send('AssetFlow API Server is running');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An internal server error occurred' });
});

// Database connection & Server Startup
const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetflow';
    console.log(`Attempting to connect to MongoDB: ${connStr}`);
    
    await mongoose.connect(connStr);
    console.log('MongoDB Connected Successfully.');
    
    app.listen(PORT, () => {
      console.log(`AssetFlow Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

connectDB();
