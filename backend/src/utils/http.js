export class HttpError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details; }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function reference() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `LA-${date}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}
