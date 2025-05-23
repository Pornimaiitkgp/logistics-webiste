// backend/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET; // Ensure JWT_SECRET is loaded

// Check if JWT_SECRET is loaded (important for security)
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file!");
  process.exit(1); // Exit the process if secret is missing
}

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[App] Incoming Request: ${req.method} ${req.url}`);
  next();
});

app.use(express.json()); // Middleware to parse JSON request bodies

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./src/routes/authRoutes'); // New: Import auth routes
const calculationRoutes = require('./src/routes/calculationRoutes');
const { protect } = require('./src/middleware/authMiddleware'); // New: Import protect middleware

// --- Route Integration ---
// IMPORTANT: Authentication routes MUST come BEFORE protected routes
// Authentication routes (publicly accessible)
app.use('/api/auth', authRoutes); // All auth routes prefixed with '/api/auth'

// Protected calculation routes (require authentication)
// The 'protect' middleware will run before any calculation route
app.use('/api', protect, calculationRoutes); // All calculation routes prefixed with '/api' and protected

// Simple root route
app.get('/', (req, res) => {
  console.log('[App] Root route / hit');
  res.send('Logistics Backend is running!');
});

// 404 Not Found Handler
app.use((req, res, next) => {
  console.warn(`[App] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Sorry, that route does not exist.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
