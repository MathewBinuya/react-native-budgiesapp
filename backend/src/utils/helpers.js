import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
}

export function todayStr(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

export function makeInviteCode() {
  return 'BUDGIE-' + crypto.randomBytes(2).toString('hex').toUpperCase();
}

export function stageFromCare(careLevel) {
  if (careLevel >= 67) return 'budgie';
  if (careLevel >= 34) return 'chick';
  return 'egg';
}