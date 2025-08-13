import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
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
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import liveRoutes from './routes/liveRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import zoneRoutes from './routes/zoneRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import whatsappRoutes from './routes/whatsappRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import driverProfileRoutes from './routes/driverProfileRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import vehicleManagementRoutes from './routes/vehicleRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import driverDocumentRoutes from './routes/driverDocumentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import supportTicketRoutes from './routes/supportTicketRoutes.js';
import financialReportRoutes from './routes/financialReportRoutes.js';
import promoCodeRoutes from './routes/promoCodeRoutes.js';

import { auditLogger } from './middleware/audit.js';
import { i18n } from './middleware/i18n.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import path from 'path';
import fs from 'fs';
import { setDriverLocation } from './utils/liveStore.js';
import { setIO } from './services/notifyService.js';
import notificationService from './services/notificationService.js';
import cookieParser from 'cookie-parser';
import { authenticate, requireActive } from './middleware/auth.js';

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

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.ADMIN_URL || "http://localhost:5174"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(i18n);
app.use(auditLogger);
app.use('/api/', createRateLimiter({ windowMs: 60_000, max: 300 }));

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Socket.io setup with matching CORS origins
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
setIO(io);

// Initialize notification service
notificationService.initialize(server);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.join(`user:${userId}`);

  socket.on('ride:location', (payload) => {
    if (payload?.rideId) socket.to(`ride:${payload.rideId}`).emit('ride:location', payload);
  });

  socket.on('ride:join', (rideId) => {
    socket.join(`ride:${rideId}`);
    console.log(`User ${userId} joined ride room: ${rideId}`);
  });

  socket.on('ride:leave', (rideId) => {
    socket.leave(`ride:${rideId}`);
    console.log(`User ${userId} left ride room: ${rideId}`);
  });

  // Live tracking events
  socket.on('tracking:start', async (payload) => {
    const { rideId, driverId, customerId } = payload;
    socket.join(`tracking:${rideId}`);

    const trackingService = (await import('./services/trackingService.js')).default;
    await trackingService.startRideTracking(rideId, driverId, customerId);
  });

  socket.on('tracking:stop', async (payload) => {
    const { rideId, reason } = payload;
    socket.leave(`tracking:${rideId}`);

    const trackingService = (await import('./services/trackingService.js')).default;
    await trackingService.stopRideTracking(rideId, reason);
  });

  socket.on('location:update', async (payload) => {
    const { lat, lng, heading, speed, accuracy } = payload;

    const trackingService = (await import('./services/trackingService.js')).default;
    await trackingService.updateDriverLocation(userId, { lat, lng, heading, speed, accuracy });
  });

  socket.on('trigger:emergency', async (payload) => {
    const { rideId, location, message } = payload;

    const trackingService = (await import('./services/trackingService.js')).default;
    await trackingService.triggerEmergencyTracking(rideId, userId, location);
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

const driverNs = io.of('/driver');
driverNs.on('connection', (socket) => {
  const driverId = socket.handshake.auth?.driverId;
  if (!driverId) return socket.disconnect(true);
  socket.join(`driver:${driverId}`);
  socket.on('location', async (payload) => { if (payload?.lng != null && payload?.lat != null) await setDriverLocation(driverId, payload.lng, payload.lat); });
  socket.on('disconnect', () => { /* could mark as unavailable after grace */ });
  socket.on('location', async (payload) => {
    if (payload?.lng != null && payload?.lat != null) await setDriverLocation(driverId, payload.lng, payload.lat);
  });

});

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
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/driver-profile', authenticate, requireActive, driverProfileRoutes);
app.use('/api/vehicle-management', authenticate, requireActive, vehicleManagementRoutes);
app.use('/api/support', authenticate, requireActive, supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/driver-documents', driverDocumentRoutes);
app.use('/api/chat', authenticate, requireActive, chatRoutes);
app.use('/api/support', authenticate, requireActive, supportTicketRoutes);
app.use('/api/financial', authenticate, requireActive, financialReportRoutes);
app.use("/api/bookings", bookingRoutes);

// Start server and connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    server.listen(process.env.PORT || 5000, () => console.log(`Server running on port ${process.env.PORT || 5000}`));
  })
  .catch((err) => console.error(err));

export function getIoInstance() {
  return io;
}
