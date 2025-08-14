import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  role: Joi.string().valid('customer', 'driver', 'admin').required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const signBoth = (user) => {
  const base = { id: user._id, role: user.role, name: user.name, isActive: user.isActive };
  return { access: signAccessToken(base), refresh: signRefreshToken(base) };
};

export const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

  const passwordHash = await User.hashPassword(value.password);
  const user = await User.create({ ...value, passwordHash });
  const { access, refresh } = signBoth(user);
  res.cookie('access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.status(201).json({ success: true, data: { token: access, refresh } });
};

export const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const user = await User.findOne({ email: value.email }).select('+passwordHash');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const ok = await user.comparePassword(value.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const { access, refresh } = signBoth(user);
  res.cookie('access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, data: { token: access, refresh, user: { id: user._id, name: user.name, role: user.role, email: user.email } } });
};

export const refresh = async (req, res) => {
  const token = req.cookies?.refresh_token || req.body.refresh;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ success: false, message: 'Invalid refresh' });
    const { access, refresh } = signBoth(user);
    res.cookie('access_token', access, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60 * 1000 });
    res.cookie('refresh_token', refresh, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, data: { token: access, refresh } });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
export const logout = async (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.json({ success: true });
};