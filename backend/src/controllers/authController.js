import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js';

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

const signToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

  const passwordHash = await User.hashPassword(value.password);
  const user = await User.create({ ...value, passwordHash });
  const token = signToken(user);
  res.status(201).json({ success: true, data: { token, user: { id: user._id, name: user.name, role: user.role, email: user.email } } });
};

export const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });

  const user = await User.findOne({ email: value.email }).select('+passwordHash');
  if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
  const ok = await user.comparePassword(value.password);
  if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ success: true, data: { token, user: { id: user._id, name: user.name, role: user.role, email: user.email } } });
};