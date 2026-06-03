import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';

// Route Imports
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import adminRoutes from './routes/admin.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Load ENV variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  // Initialize Interview Knowledge Base with 50 docs
  import('./config/documentIndexer.js').then(m => m.initializeInterviewKB());
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware Configuration
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all in local/development. In production, this can be locked down
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Support larger payload sizes for parsed resume texts
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply General Rate Limiter to all API routes
app.use('/api', apiLimiter);

// API Endpoints Mapping
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/interview', chatRoutes);
app.use('/api/admin', adminRoutes);

// Base Route / Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    demoMode: process.env.DEMO_MODE === 'true'
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected server error occurred.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
