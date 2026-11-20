import { query } from '../config/db.js';

// Persist an uploaded image in MySQL and return a stable public URL.
// Storing bytes in the database (rather than on the container filesystem)
// means uploads survive Render redeploys and restarts.
export async function storeAsset(file) {
  const result = await query(
    'INSERT INTO assets(mime_type,file_name,data) VALUES(?,?,?)',
    [file.mimetype, file.originalname || null, file.buffer]
  );
  return `/api/assets/${result.insertId}`;
}

export async function deleteAsset(url) {
  const match = /^\/api\/assets\/(\d+)$/.exec(String(url || ''));
  if (match) await query('DELETE FROM assets WHERE id=?', [match[1]]);
}
