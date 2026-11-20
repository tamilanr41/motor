import { Router } from 'express';
import { query } from '../config/db.js';
import { asyncHandler, HttpError } from '../utils/http.js';

const router = Router();

// Public: product photos, category images, banners and the site logo all use
// these URLs. No auth required, and cached hard because asset URLs are immutable.
router.get('/:id', asyncHandler(async (req, res) => {
  const rows = await query('SELECT mime_type,data FROM assets WHERE id=?', [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'Image not found');
  res.set({
    'Content-Type': rows[0].mime_type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': rows[0].data.length
  });
  res.send(rows[0].data);
}));

export default router;
