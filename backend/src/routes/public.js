import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool, query } from '../config/db.js';
import { asyncHandler, HttpError, reference } from '../utils/http.js';
import { notifyEnquiry } from '../utils/notify.js';
import { verifyImageUploads } from '../middleware/imageValidation.js';
import { optionalCustomer } from '../middleware/auth.js';

const router = Router();
const here=path.dirname(fileURLToPath(import.meta.url));
const enquiryUploadDir=path.resolve(here,'../..',process.env.UPLOAD_DIR||'uploads','enquiries');
mkdirSync(enquiryUploadDir,{recursive:true});
const enquiryUpload=multer({storage:multer.diskStorage({destination(_req,_file,cb){cb(null,enquiryUploadDir);},filename(_req,file,cb){const ext=({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'})[file.mimetype];cb(null,`${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);}}),limits:{fileSize:8*1024*1024,files:5},fileFilter(_req,file,cb){cb(['image/jpeg','image/png','image/webp'].includes(file.mimetype)?null:new Error('Only JPG, PNG and WebP images can be attached.'),['image/jpeg','image/png','image/webp'].includes(file.mimetype));}});
const parseEnquiryFiles=(req,res,next)=>enquiryUpload.array('attachments',5)(req,res,err=>{if(err){err.status=400;return next(err);}next();});

router.get('/categories', asyncHandler(async (_req, res) => {
  const rows = await query(`SELECT c.id,c.name,c.slug,c.description,c.image_url,c.display_order,c.is_featured,
    (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.is_active=1 AND p.needs_review=0 AND p.deleted_at IS NULL) product_count
    FROM categories c WHERE c.is_active=1 AND c.deleted_at IS NULL ORDER BY c.display_order,c.name`);
  const subs = await query('SELECT id,category_id,name,slug FROM subcategories WHERE is_active=1 AND deleted_at IS NULL ORDER BY display_order,name');
  res.json(rows.map(c => ({ ...c, subcategories: subs.filter(s => s.category_id === c.id) })));
}));

router.get('/brands', asyncHandler(async (_req, res) => {
  const rows = await query(`SELECT b.id,b.name,b.slug,b.logo_url,
    COUNT(DISTINCT p.id) product_count,
    GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') categories
    FROM brands b LEFT JOIN category_brands cb ON cb.brand_id=b.id
    LEFT JOIN categories c ON c.id=cb.category_id AND c.is_active=1
    LEFT JOIN product_brands pb ON pb.brand_id=b.id LEFT JOIN products p ON p.id=pb.product_id AND p.is_active=1 AND p.needs_review=0 AND p.deleted_at IS NULL
    WHERE b.is_active=1 AND b.deleted_at IS NULL GROUP BY b.id ORDER BY b.name`);
  res.json(rows);
}));
router.get('/banners', asyncHandler(async(_req,res)=>res.json(await query('SELECT id,title,subtitle,image_url,cta_label,cta_url,display_order FROM banners WHERE is_active=1 ORDER BY display_order,id LIMIT 8'))));

router.get('/brands/:slug', asyncHandler(async (req,res) => {
  const brands = await query('SELECT id,name,slug,logo_url,description FROM brands WHERE slug=? AND is_active=1 AND deleted_at IS NULL',[req.params.slug]);
  if (!brands[0]) throw new HttpError(404,'Brand not found');
  const products = await query(`SELECT p.id,p.name,p.slug,p.model_number,p.hp_rating,p.phase,
    c.name category_name,c.slug category_slug,pi.image_url,
    (SELECT GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') FROM product_brands pb JOIN brands b ON b.id=pb.brand_id WHERE pb.product_id=p.id) brands
    FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1
    JOIN product_brands pb0 ON pb0.product_id=p.id WHERE pb0.brand_id=? AND p.is_active=1 AND p.needs_review=0 AND p.deleted_at IS NULL AND c.is_active=1 AND c.deleted_at IS NULL ORDER BY p.name`,[brands[0].id]);
  res.json({ ...brands[0], products });
}));

router.get('/products', asyncHandler(async (req,res) => {
  const page = Math.max(1, Number.parseInt(req.query.page,10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit,10) || 12));
  const where = ['p.is_active=1','p.needs_review=0','p.deleted_at IS NULL','c.is_active=1','c.deleted_at IS NULL']; const values=[];
  if (req.query.q) { where.push('(p.name LIKE ? OR p.model_number LIKE ? OR p.description LIKE ?)'); const q=`%${String(req.query.q).slice(0,100)}%`; values.push(q,q,q); }
  if (req.query.category) { where.push('c.slug=?'); values.push(String(req.query.category)); }
  if (req.query.subcategory) { where.push('s.slug=?'); values.push(String(req.query.subcategory)); }
  if (req.query.brand) { where.push('EXISTS(SELECT 1 FROM product_brands px JOIN brands bx ON bx.id=px.brand_id WHERE px.product_id=p.id AND bx.slug=? AND bx.is_active=1 AND bx.deleted_at IS NULL)'); values.push(String(req.query.brand)); }
  if (req.query.featured === '1') where.push('p.is_featured=1');
  const clause=where.join(' AND ');
  const countRows=await query(`SELECT COUNT(DISTINCT p.id) total FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN subcategories s ON s.id=p.subcategory_id AND s.is_active=1 AND s.deleted_at IS NULL WHERE ${clause}`,values);
  const sort={name:'p.name ASC',newest:'p.created_at DESC',category:'c.display_order ASC,p.name ASC'}[req.query.sort] || 'p.is_featured DESC,p.name ASC';
  const products=await query(`SELECT p.id,p.name,p.slug,p.model_number,p.description,p.hp_rating,p.phase,p.availability,p.specifications,
      c.name category_name,c.slug category_slug,s.name subcategory_name,s.slug subcategory_slug,
      (SELECT GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') FROM product_brands pb JOIN brands b ON b.id=pb.brand_id WHERE pb.product_id=p.id AND b.is_active=1 AND b.deleted_at IS NULL) brands,
      (SELECT pi.image_url FROM product_images pi WHERE pi.product_id=p.id ORDER BY pi.is_primary DESC,pi.display_order LIMIT 1) image_url
      FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN subcategories s ON s.id=p.subcategory_id AND s.is_active=1 AND s.deleted_at IS NULL
      WHERE ${clause} ORDER BY ${sort} LIMIT ? OFFSET ?`,[...values,limit,(page-1)*limit]);
  res.json({ items:products, page, limit, total:countRows[0].total, pages:Math.ceil(countRows[0].total/limit) });
}));

router.get('/products/:slug', asyncHandler(async (req,res) => {
  const rows=await query(`SELECT p.id,p.category_id,p.subcategory_id,p.name,p.slug,p.model_number,p.description,p.hp_rating,p.phase,p.body_material,p.stage_type,p.application_type,p.availability,p.specifications,p.seo_title,p.seo_description,p.is_featured,p.updated_at,c.name category_name,c.slug category_slug,s.name subcategory_name,s.slug subcategory_slug,
      (SELECT GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') FROM product_brands pb JOIN brands b ON b.id=pb.brand_id WHERE pb.product_id=p.id AND b.is_active=1 AND b.deleted_at IS NULL) brands
      FROM products p JOIN categories c ON c.id=p.category_id LEFT JOIN subcategories s ON s.id=p.subcategory_id AND s.is_active=1 AND s.deleted_at IS NULL
      WHERE p.slug=? AND p.is_active=1 AND p.needs_review=0 AND p.deleted_at IS NULL AND c.is_active=1 AND c.deleted_at IS NULL`,[req.params.slug]);
  if(!rows[0]) throw new HttpError(404,'Product not found');
  const [images,specs,related]=await Promise.all([
    query('SELECT image_url,alt_text,display_order,is_primary FROM product_images WHERE product_id=? ORDER BY is_primary DESC,display_order',[rows[0].id]),
    query('SELECT spec_name,spec_value FROM product_specifications WHERE product_id=? ORDER BY display_order',[rows[0].id]),
    query(`SELECT p.name,p.slug,p.hp_rating,p.phase,pi.image_url FROM products p LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1 JOIN categories c ON c.id=p.category_id WHERE p.category_id=? AND p.id<>? AND p.is_active=1 AND p.needs_review=0 AND p.deleted_at IS NULL AND c.is_active=1 AND c.deleted_at IS NULL LIMIT 4`,[rows[0].category_id,rows[0].id])
  ]);
  res.json({ ...rows[0], images, specifications:specs.length?specs:rows[0].specifications, related });
}));

router.get('/content/:key', asyncHandler(async(req,res)=>{
  const rows=await query('SELECT page_key,title,body,meta_title,meta_description FROM page_contents WHERE page_key=?',[req.params.key]);
  res.json(rows[0] || null);
}));
router.get('/settings/public', asyncHandler(async(_req,res)=>{
  const rows=await query('SELECT setting_key,setting_value FROM website_settings WHERE is_private=0');
  res.json(Object.fromEntries(rows.map(r=>[r.setting_key,r.setting_value])));
}));

const enquirySchema=z.object({
  customerName:z.string().trim().min(2).max(160), companyName:z.string().trim().max(180).optional().or(z.literal('')),
  mobile:z.string().trim().min(7).max(40), email:z.string().trim().email().max(190).optional().or(z.literal('')),
  category:z.string().trim().max(180).optional().or(z.literal('')),productName:z.string().trim().max(240).optional().or(z.literal('')),
  brandPreference:z.string().trim().max(160).optional().or(z.literal('')),quantity:z.string().trim().max(80).optional().or(z.literal('')),
  specifications:z.string().trim().max(4000).optional().or(z.literal('')),message:z.string().trim().max(4000).optional().or(z.literal('')),
  productId:z.coerce.number().int().positive().optional(),source:z.string().trim().max(80).optional()
});

router.post('/enquiries', optionalCustomer, parseEnquiryFiles, verifyImageUploads, asyncHandler(async(req,res)=>{
  const data=enquirySchema.parse(req.body);
  if(req.customer){const accountRows=await query('SELECT id FROM customer_accounts WHERE id=? AND active=1',[req.customer.id]);if(!accountRows[0])throw new HttpError(401,'Your customer account is no longer active.');}
  if(data.productId){const found=await query('SELECT id FROM products WHERE id=? AND is_active=1 AND deleted_at IS NULL',[data.productId]);if(!found[0])throw new HttpError(400,'The selected product is no longer available in the catalogue.');}
  const ref=reference(); const conn=await pool.getConnection(); let id;
  try {
    await conn.beginTransaction();
    const [result]=await conn.execute(`INSERT INTO enquiries(customer_account_id,reference_no,customer_name,company_name,mobile,email,category_name,product_name,brand_preference,quantity,specifications,message,source)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,[req.customer?.id||null,ref,data.customerName,data.companyName||null,data.mobile,data.email||null,data.category||null,data.productName||null,data.brandPreference||null,data.quantity||null,data.specifications||null,data.message||null,data.source||'website']);
    id=result.insertId;
    if(data.productName) await conn.execute('INSERT INTO enquiry_items(enquiry_id,product_id,product_name,brand_name,quantity,specifications) VALUES(?,?,?,?,?,?)',[id,data.productId||null,data.productName,data.brandPreference||null,data.quantity||null,data.specifications||null]);
    for(const file of req.files||[]) await conn.execute('INSERT INTO enquiry_attachments(enquiry_id,file_url,original_name,mime_type,file_size) VALUES(?,?,?,?,?)',[id,`/uploads/enquiries/${file.filename}`,file.originalname,file.mimetype,file.size]);
    await conn.commit();
  } catch(err) { await conn.rollback(); throw err; } finally { conn.release(); }
  try { await notifyEnquiry({reference:ref,customerName:data.customerName,companyName:data.companyName,mobile:data.mobile,email:data.email,productName:data.productName,category:data.category,quantity:data.quantity,message:data.message}); }
  catch(err) { console.error('Enquiry email notification failed:',err.message); }
  res.status(201).json({success:true,reference:ref,message:'Thank you. Your enquiry has been received.'});
}));

export default router;
