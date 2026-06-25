import User from '../models/user.model.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { signToken } from '../utils/helpers.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, accentColor } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'Email already in use' });

  const user = await User.create({ name, email, password, accentColor });
  const token = signToken(user._id);
  res.status(201).json({
    token,
    user: publicUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  const token = signToken(user._id);
  res.json({ token, user: publicUser(user) });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    couple: u.couple,
    accentColor: u.accentColor,
    avatar: u.avatar,
  };
}