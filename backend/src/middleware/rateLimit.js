import rateLimit from 'express-rate-limit';

export const createRateLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message });