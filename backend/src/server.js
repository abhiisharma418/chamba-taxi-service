import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bookingRoutes from "./routes/bookingRoutes.js";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import liveRoutes from './routes/liveRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import { auditLogger } from './middleware/audit.js';
import { i18n } from './middleware/i18n.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import path from 'path';
import fs from 'fs';
import { setDriverLocation } from './utils/liveStore.js';
import { setIO } from './services/notifyService.js';
import cookieParser from 'cookie-parser';
import { authenticate, requireActive } from './middleware/auth.js';

dotenv.config();
const app = express();
const server = http.createServer(app);

// Stripe raw body
app.use('/api/payments/webhook/stripe', (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => { data += chunk; });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
});

// Static uploads
const uploadsPath = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Socket.io
const io = new SocketIOServer(server, {
  cors: { origin: [ process.env.FRONTEND_URL || "http://localhost:5173", process.env.ADMIN_URL || "http://localhost:5174" ], credentials: true },
});
setIO(io);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.join(`user:${userId}`);
  socket.on('ride:location', (payload) => { if (payload?.rideId) socket.to(`ride:${payload.rideId}`).emit('ride:location', payload); });
  socket.on('ride:join', (rideId) => { socket.join(`ride:${rideId}`); });
});

const driverNs = io.of('/driver');
driverNs.on('connection', (socket) => {
  const driverId = socket.handshake.auth?.driverId;
  if (!driverId) return socket.disconnect(true);
  socket.join(`driver:${driverId}`);
  socket.on('location', async (payload) => { if (payload?.lng != null && payload?.lat != null) await setDriverLocation(driverId, payload.lng, payload.lat); });
});

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(i18n);
app.use(auditLogger);
app.use('/api/', createRateLimiter({ windowMs: 60_000, max: 300 }));

// CORS
const allowedOrigins = [ process.env.FRONTEND_URL || "http://localhost:5173", process.env.ADMIN_URL || "http://localhost:5174" ].filter(Boolean);
app.use(cors({ origin: (origin, cb) => { if (!origin) return cb(null, true); if (allowedOrigins.includes(origin)) return cb(null, true); return cb(new Error('Not allowed by CORS')); }, credentials: true }));

// Docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', authenticate, requireActive, rideRoutes);
app.use('/api/vehicles', authenticate, requireActive, vehicleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', authenticate, requireActive, reviewRoutes);
app.use('/api/tickets', authenticate, requireActive, ticketRoutes);
app.use('/api/admin', authenticate, requireActive, adminRoutes);
app.use('/api/pricing', authenticate, requireActive, pricingRoutes);
app.use('/api/zones', authenticate, requireActive, zoneRoutes);
app.use('/api/driver', authenticate, requireActive, driverRoutes);
app.use('/api/live', authenticate, requireActive, liveRoutes);
app.use('/api/devices', authenticate, requireActive, deviceRoutes);
app.use("/api/bookings", bookingRoutes);

// Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log("MongoDB Connected"); server.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`)); })
  .catch((err) => console.error(err));
