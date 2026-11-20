import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, query } from './config/db.js';
import { errorHandler } from './middleware/errors.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import customerRoutes from './routes/customer.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  const defaultOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'https://lakshmiagency.netlify.app'
  ];
  const configuredOrigins = [process.env.FRONTEND_URL, process.env.PUBLIC_SITE_URL, process.env.CORS_ORIGINS]
    .filter(Boolean)
    .flatMap(value => value.split(','))
    .map(value => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];
  app.use(cors({ origin: allowedOrigins, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use('/uploads', express.static(path.resolve(here, '..', process.env.UPLOAD_DIR || 'uploads'), { maxAge: '7d', immutable: true }));
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false }));
  app.use('/api/admin/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, message: { error: 'Too many sign-in attempts. Please try again later.' } }));
  app.use('/api/customer/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, message: { error: 'Too many sign-in attempts. Please try again later.' } }));
  app.use('/api/customer/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, message: { error: 'Too many account attempts. Please try again later.' } }));
  app.use('/api/enquiries', rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, message: { error: 'Too many enquiries were submitted from this connection. Please try again later.' } }));
  app.get('/api/health', async (_req, res, next) => {
    try { await pool.query('SELECT 1'); res.json({ status: 'ok' }); } catch (err) { next(err); }
  });
  app.get('/api/debug-env', (_req, res) => res.json({ db_ssl: process.env.DB_SSL || '', db_ssl_reject: process.env.DB_SSL_REJECT_UNAUTHORIZED || '', jwt_set: Boolean(process.env.JWT_SECRET), node: process.version, db_host_set: Boolean(process.env.DB_HOST), db_name_set: Boolean(process.env.DB_NAME) }));
  app.use('/api', publicRoutes);
  app.use('/api/customer', customerRoutes);
  app.use('/api/admin', adminRoutes);
  app.get('/robots.txt', (_req, res) => res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${(process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '')}/sitemap.xml`));
  app.get('/sitemap.xml', async (_req, res, next) => {
    try {
      const [products, categories, brands] = await Promise.all([
        query('SELECT slug, updated_at FROM products WHERE is_active=1 AND needs_review=0 AND deleted_at IS NULL'),
        query('SELECT slug, updated_at FROM categories WHERE is_active=1 AND deleted_at IS NULL'),
        query('SELECT slug, updated_at FROM brands WHERE is_active=1 AND deleted_at IS NULL')
      ]);
      const base = (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
      const urls = ['/', '/about', '/products', '/brands', '/services', '/contact', '/quote', ...categories.map(x => `/products?category=${x.slug}`), ...products.map(x => `/products/${x.slug}`), ...brands.map(x => `/brands/${x.slug}`)];
      res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(u => `<url><loc>${base}${u.replaceAll('&','&amp;')}</loc></url>`).join('')}</urlset>`);
    } catch (err) { next(err); }
  });
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}
