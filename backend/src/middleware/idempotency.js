import { getRedis } from '../utils/redis.js';

export const idempotency = (ttlSeconds = 300) => async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next();
  const redis = getRedis();
  const exists = await redis.get(`idem:${key}`);
  if (exists) {
    res.setHeader('X-Idempotency', 'HIT');
    return res.status(409).json({ success: false, message: 'Duplicate request' });
  }
  await redis.setex(`idem:${key}`, ttlSeconds, '1');
  res.setHeader('X-Idempotency', 'MISS');
  next();
};