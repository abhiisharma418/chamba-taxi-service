import jwt from 'jsonwebtoken';

export const signAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
export const signRefreshToken = (payload) => jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);
