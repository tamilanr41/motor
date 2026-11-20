import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { HttpError } from '../utils/http.js';

export async function requireAdmin(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new HttpError(401, 'Admin sign-in required'));
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'admin') throw new Error('Wrong account type');
  }
  catch { return next(new HttpError(401, 'Your session has expired. Please sign in again.')); }
  try {
    const rows = await query('SELECT id,name,email,role FROM admins WHERE id=? AND active=1', [payload.id]);
    if (!rows[0]) return next(new HttpError(401, 'Admin account is inactive'));
    req.admin = { ...rows[0], type: 'admin' };
    return next();
  }
  catch (err) {
    if (err?.status) return next(err);
    return next(new HttpError(500, 'Unable to verify admin session'));
  }
}

export function optionalCustomer(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'customer') throw new Error('Wrong account type');
    req.customer = payload;
    next();
  } catch {
    next(new HttpError(401, 'Your customer session has expired. Please sign in again.'));
  }
}

export function requireCustomer(req, _res, next) {
  optionalCustomer(req, _res, (err) => {
    if (err) return next(err);
    if (!req.customer) return next(new HttpError(401, 'Customer sign-in required'));
    next();
  });
}
