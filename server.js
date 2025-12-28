require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('========================');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED REJECTION ===');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('=========================');
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// User management routes (protected)
app.use('/api/users', require('./routes/users'));

// Routes
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uom', require('./routes/uom'));
app.use('/api/gst-rates', require('./routes/gstRates'));
app.use('/api/items', require('./routes/items'));
app.use('/api/transporters', require('./routes/transporters'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/dispatches', require('./routes/dispatches'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/scrap-grn', require('./routes/scrapGrn'));
app.use('/api/melting-processes', require('./routes/meltingProcesses'));
app.use('/api/heat-treatment', require('./routes/heatTreatment'));
app.use('/api/stock-reports', require('./routes/stockReports'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('=== ERROR CAUGHT ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('===================');
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`SteelMelt ERP Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
