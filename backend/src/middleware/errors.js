import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) return res.status(400).json({ error: 'Please check the submitted fields.', details: err.flatten().fieldErrors });
  const status = err.status || (err.code?.startsWith('LIMIT_') ? 400 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message, details: err.details, debug: status >= 500 ? { code: err.code, message: err.message, sqlMessage: err.sqlMessage, name: err.name } : undefined });
}
