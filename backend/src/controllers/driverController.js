import { User } from '../models/userModel.js';
import { Ride } from '../models/rideModel.js';

export const uploadDocuments = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user || user.role !== 'driver') return res.status(403).json({ success: false, message: 'Forbidden' });
  const files = (req.files || []).map(f => ({ filename: f.filename, url: `/uploads/${f.filename}`, uploadedAt: new Date() }));
  user.driver = user.driver || {};
  user.driver.documents = [...(user.driver.documents || []), ...files];
  user.driver.verificationStatus = 'pending';
  await user.save();
  res.status(201).json({ success: true, data: user.driver });
};

export const adminSetVerification = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'driver') return res.status(404).json({ success: false, message: 'Driver not found' });
  user.driver = user.driver || {};
  user.driver.verificationStatus = req.body.status;
  await user.save();
  res.json({ success: true, data: user.driver });
};
