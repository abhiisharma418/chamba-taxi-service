import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';
import { Vehicle } from '../models/vehicleModel.js';

export const getStats = async (req, res) => {
  const [users, rides, vehicles] = await Promise.all([
    User.countDocuments(),
    Ride.countDocuments(),
    Vehicle.countDocuments(),
  ]);
  res.json({ success: true, data: { users, rides, vehicles } });
};

export const listUsers = async (req, res) => {
  const list = await User.find().select('-passwordHash').sort({ createdAt: -1 });
  res.json({ success: true, data: list });
};

export const updateUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: !!req.body.isActive }, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
};