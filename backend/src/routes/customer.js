import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/db.js';
import { requireCustomer } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();
const accountFields = 'id,name,company_name,email,mobile,created_at';
const publicAccount = (row) => ({ id: row.id, name: row.name, company_name: row.company_name || '', email: row.email, mobile: row.mobile, created_at: row.created_at });
const customerToken = (account) => jwt.sign({ id: account.id, email: account.email, type: 'customer' }, process.env.JWT_SECRET, { expiresIn: process.env.CUSTOMER_JWT_EXPIRES_IN || '24h' });

const registerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  companyName: z.string().trim().max(180).optional().or(z.literal('')),
  email: z.string().trim().email().max(190),
  mobile: z.string().trim().min(7).max(40),
  password: z.string().min(12).max(200)
});

async function loadAccount(id) {
  const rows = await query(`SELECT ${accountFields},active FROM customer_accounts WHERE id=?`, [id]);
  if (!rows[0] || !rows[0].active) throw new HttpError(401, 'This customer account is no longer active.');
  return rows[0];
}

router.post('/auth/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  const email = data.email.toLowerCase();
  try {
    const result = await query('INSERT INTO customer_accounts(name,company_name,email,mobile,password_hash) VALUES(?,?,?,?,?)', [
      data.name, data.companyName || null, email, data.mobile, await bcrypt.hash(data.password, 12)
    ]);
    const account = { id: result.insertId, name: data.name, company_name: data.companyName || '', email, mobile: data.mobile };
    res.status(201).json({ token: customerToken(account), customer: publicAccount(account) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
    throw err;
  }
}));

router.post('/auth/login', asyncHandler(async (req, res) => {
  const data = z.object({ email: z.string().trim().email().max(190), password: z.string().min(1).max(200) }).parse(req.body);
  const rows = await query(`SELECT ${accountFields},password_hash,active FROM customer_accounts WHERE email=?`, [data.email.toLowerCase()]);
  const account = rows[0];
  if (!account || !account.active || !(await bcrypt.compare(data.password, account.password_hash))) throw new HttpError(401, 'Email or password is incorrect.');
  await query('UPDATE customer_accounts SET last_login_at=NOW() WHERE id=?', [account.id]);
  res.json({ token: customerToken(account), customer: publicAccount(account) });
}));

router.use(requireCustomer);

router.get('/me', asyncHandler(async (req, res) => {
  res.json(publicAccount(await loadAccount(req.customer.id)));
}));

router.patch('/me', asyncHandler(async (req, res) => {
  const data = z.object({
    name: z.string().trim().min(2).max(160),
    companyName: z.string().trim().max(180).optional().or(z.literal('')),
    mobile: z.string().trim().min(7).max(40)
  }).parse(req.body);
  await loadAccount(req.customer.id);
  await query('UPDATE customer_accounts SET name=?,company_name=?,mobile=? WHERE id=?', [data.name, data.companyName || null, data.mobile, req.customer.id]);
  const rows = await query(`SELECT ${accountFields} FROM customer_accounts WHERE id=?`, [req.customer.id]);
  res.json(publicAccount(rows[0]));
}));

router.post('/auth/change-password', asyncHandler(async (req, res) => {
  const data = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(12).max(200) }).parse(req.body);
  const rows = await query('SELECT password_hash FROM customer_accounts WHERE id=? AND active=1', [req.customer.id]);
  if (!rows[0] || !(await bcrypt.compare(data.currentPassword, rows[0].password_hash))) throw new HttpError(400, 'Current password is incorrect.');
  await query('UPDATE customer_accounts SET password_hash=? WHERE id=?', [await bcrypt.hash(data.newPassword, 12), req.customer.id]);
  res.json({ success: true });
}));

router.get('/dashboard', asyncHandler(async (req, res) => {
  const account = publicAccount(await loadAccount(req.customer.id));
  const [counts, requests] = await Promise.all([
    query(`SELECT COUNT(*) total_requests,
      SUM(status IN ('New','Contacted','Follow-up')) active_requests,
      SUM(status='Quotation Sent') quotations_sent,
      SUM(status='Converted') completed_requests
      FROM enquiries WHERE customer_account_id=? AND deleted_at IS NULL`, [req.customer.id]),
    query(`SELECT id,reference_no,category_name,product_name,brand_preference,quantity,specifications,message,status,created_at,updated_at
      FROM enquiries WHERE customer_account_id=? AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`, [req.customer.id])
  ]);
  res.json({ customer: account, metrics: counts[0], requests });
}));

export default router;
