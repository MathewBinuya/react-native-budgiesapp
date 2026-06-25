import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
}

export function requireCouple(req, res, next) {
  if (!req.user.couple) {
    return res
      .status(403)
      .json({ message: 'You need to pair with a partner first' });
  }
  next();
}