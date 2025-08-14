import { User } from '../models/userModel.js';

export const getProfile = async (req, res) => {
  try {
    // req.user.id authenticate middleware se aata hai
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};