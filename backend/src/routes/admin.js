import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import crypto from 'node:crypto';
import { z } from 'zod';
import { pool, query } from '../config/db.js';
import { requireAdmin } from '../middleware/auth.js';
import { verifyImageUploads } from '../middleware/imageValidation.js';
import { storeAsset, deleteAsset } from '../utils/assets.js';
import { asyncHandler, HttpError, slug } from '../utils/http.js';

const router=Router();
// Keep bytes in memory, then persist them in MySQL via the asset store.
// Render's container filesystem is ephemeral, so disk uploads are not durable.
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:Number(process.env.MAX_UPLOAD_MB||8)*1024*1024,files:8},fileFilter(_req,file,cb){ cb(null,['image/jpeg','image/png','image/webp'].includes(file.mimetype)); }});

async function log(req,action,type,id,details={}) {
  await query('INSERT INTO admin_activity_logs(admin_id,action,entity_type,entity_id,details,ip_address) VALUES(?,?,?,?,?,?)',[req.admin?.id||null,action,type,id,JSON.stringify(details),req.ip]);
}
const allowedRoles=['owner','manager','editor'];
const requireRoles=(...roles)=>(req,_res,next)=>roles.includes(req.admin?.role)?next():next(new HttpError(403,'Your admin role cannot perform this action'));
const ownerOrManager=requireRoles('owner','manager');
const ownerOnly=requireRoles('owner');

router.post('/auth/login',asyncHandler(async(req,res)=>{
  const data=z.object({email:z.string().email().max(190),password:z.string().min(1).max(200)}).parse(req.body);
  const rows=await query('SELECT id,name,email,password_hash,role FROM admins WHERE email=? AND active=1',[data.email.toLowerCase()]);
  const admin=rows[0];
  if(!admin || !(await bcrypt.compare(data.password,admin.password_hash))) throw new HttpError(401,'Email or password is incorrect');
  await query('UPDATE admins SET last_login_at=NOW() WHERE id=?',[admin.id]);
  const token=jwt.sign({id:admin.id,email:admin.email,role:admin.role,type:'admin'},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});
  await log({admin:{id:admin.id},ip:req.ip},'login','admin',admin.id);
  res.json({token,admin:{id:admin.id,name:admin.name,email:admin.email,role:admin.role}});
}));

const safeSecretMatch=(provided,expected)=>{
  if(!expected) return false;
  const a=Buffer.from(String(provided||''));
  const b=Buffer.from(String(expected));
  return a.length===b.length && crypto.timingSafeEqual(a,b);
};

router.post('/auth/register',asyncHandler(async(req,res)=>{
  if(!process.env.ADMIN_REGISTRATION_SECRET) throw new HttpError(403,'Admin registration is disabled');
  const data=z.object({
    name:z.string().min(2).max(120),
    email:z.string().email().max(190),
    password:z.string().min(12).max(200),
    secret:z.string().min(1).max(200)
  }).parse(req.body);
  if(!safeSecretMatch(data.secret,process.env.ADMIN_REGISTRATION_SECRET)) throw new HttpError(403,'Invalid admin registration secret');
  const email=data.email.toLowerCase().trim();
  const existing=await query('SELECT id FROM admins WHERE email=?',[email]);
  if(existing[0]) throw new HttpError(409,'An admin with this email already exists');
  const passwordHash=await bcrypt.hash(data.password,12);
  let result;
  try {
    result=await query('INSERT INTO admins(name,email,password_hash,role,active) VALUES(?,?,?,?,1)',[data.name.trim(),email,passwordHash,'editor']);
  } catch(error) {
    if(error.code==='ER_DUP_ENTRY') throw new HttpError(409,'An admin with this email already exists');
    throw error;
  }
  const admin={id:result.insertId,name:data.name.trim(),email,role:'editor'};
  const token=jwt.sign({id:admin.id,email:admin.email,role:admin.role,type:'admin'},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'8h'});
  await log({admin,ip:req.ip},'register','admin',admin.id);
  res.status(201).json({token,admin});
}));

router.use(requireAdmin);
router.get('/auth/me',asyncHandler(async(req,res)=>{
  const rows=await query('SELECT id,name,email,role FROM admins WHERE id=? AND active=1',[req.admin.id]);
  if(!rows[0]) throw new HttpError(401,'Admin account is inactive');
  res.json(rows[0]);
}));
router.post('/auth/change-password',asyncHandler(async(req,res)=>{
  const data=z.object({currentPassword:z.string().min(1),newPassword:z.string().min(12).max(200)}).parse(req.body);
  const rows=await query('SELECT password_hash FROM admins WHERE id=?',[req.admin.id]);
  if(!rows[0]||!(await bcrypt.compare(data.currentPassword,rows[0].password_hash))) throw new HttpError(400,'Current password is incorrect');
  await query('UPDATE admins SET password_hash=? WHERE id=?',[await bcrypt.hash(data.newPassword,12),req.admin.id]);
  await log(req,'password_changed','admin',req.admin.id);
  res.json({success:true});
}));

router.get('/overview',asyncHandler(async(_req,res)=>{
  const counts=await query(`SELECT (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) total_products,
    (SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL) total_categories,
    (SELECT COUNT(*) FROM brands WHERE deleted_at IS NULL) total_brands,
    (SELECT COUNT(*) FROM customer_accounts WHERE active=1) total_customers,
    (SELECT COUNT(*) FROM enquiries WHERE deleted_at IS NULL) total_enquiries,
    (SELECT COUNT(*) FROM enquiries WHERE status='New' AND deleted_at IS NULL) new_enquiries,
    (SELECT COUNT(*) FROM enquiries WHERE status IN('New','Contacted','Quotation Sent','Follow-up') AND deleted_at IS NULL) pending_quotations`);
  const recent=await query('SELECT id,reference_no,customer_name,company_name,product_name,mobile,status,created_at FROM enquiries WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 8');
  res.json({ ...counts[0],recent });
}));
router.get('/team',asyncHandler(async(_req,res)=>res.json(await query('SELECT id,name,email,role,active FROM admins ORDER BY active DESC,name'))));
router.post('/team',ownerOnly,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().max(190),password:z.string().min(12).max(200),role:z.enum(['manager','editor']).default('editor')}).parse(req.body);
  const email=d.email.toLowerCase();
  if((await query('SELECT id FROM admins WHERE email=?',[email])).length) throw new HttpError(400,'An admin with this email already exists');
  const hash=await bcrypt.hash(d.password,10);
  const r=await query('INSERT INTO admins(name,email,password_hash,role,active) VALUES(?,?,?,?,1)',[d.name,email,hash,d.role]);
  await log(req,'admin_created','admin',r.insertId,{role:d.role});res.status(201).json({id:r.insertId});
}));
router.put('/team/:id',ownerOnly,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(120).optional(),email:z.string().email().max(190).optional(),role:z.enum(['owner','manager','editor']).optional(),active:z.boolean().optional()}).parse(req.body);
  const id=Number(req.params.id);
  if(id===req.admin.id&&((d.role&&d.role!=='owner')||d.active===false)) throw new HttpError(400,'You cannot change your own role or deactivate yourself');
  const rows=await query('SELECT id,role FROM admins WHERE id=?',[id]);
  if(!rows.length) throw new HttpError(404,'Admin not found');
  if(rows[0].role==='owner'&&((d.role&&d.role!=='owner')||d.active===false)){
    const owners=await query("SELECT COUNT(*) n FROM admins WHERE role='owner' AND active=1");
    if(owners[0].n<=1) throw new HttpError(400,'At least one active owner must remain');
  }
  const fields=[],vals=[];
  for(const [k,col] of [['name','name'],['email','email'],['role','role'],['active','active']]) if(d[k]!==undefined){fields.push(`${col}=?`);vals.push(k==='email'?d[k].toLowerCase():d[k]);}
  if(fields.length){vals.push(id);await query(`UPDATE admins SET ${fields.join(',')} WHERE id=?`,vals);}
  await log(req,'admin_updated','admin',id,d);res.json({success:true});
}));
router.delete('/team/:id',ownerOnly,asyncHandler(async(req,res)=>{
  const id=Number(req.params.id);
  if(id===req.admin.id) throw new HttpError(400,'You cannot deactivate yourself');
  const rows=await query('SELECT role FROM admins WHERE id=?',[id]);
  if(!rows.length) throw new HttpError(404,'Admin not found');
  if(rows[0].role==='owner'){
    const owners=await query("SELECT COUNT(*) n FROM admins WHERE role='owner' AND active=1");
    if(owners[0].n<=1) throw new HttpError(400,'At least one active owner must remain');
  }
  await query('UPDATE admins SET active=0 WHERE id=?',[id]);await log(req,'admin_deactivated','admin',id);res.json({success:true});
}));
router.get('/customers',asyncHandler(async(_req,res)=>res.json(await query(`SELECT c.id,c.name,c.company_name,c.email,c.mobile,c.created_at,c.last_login_at,
  COUNT(e.id) enquiry_count,MAX(e.created_at) last_enquiry_at
  FROM customer_accounts c LEFT JOIN enquiries e ON e.customer_account_id=c.id AND e.deleted_at IS NULL
  WHERE c.active=1 GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500`))));
router.put('/customers/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(160).optional(),company_name:z.string().max(180).nullable().optional(),email:z.string().email().max(190).optional(),mobile:z.string().trim().min(5).max(40).optional(),active:z.boolean().optional()}).parse(req.body);
  const id=Number(req.params.id);
  if(!(await query('SELECT id FROM customer_accounts WHERE id=?',[id])).length) throw new HttpError(404,'Customer not found');
  if(d.email&&(await query('SELECT id FROM customer_accounts WHERE email=? AND id<>?',[d.email.toLowerCase(),id])).length) throw new HttpError(400,'Another customer uses this email');
  const fields=[],vals=[];
  for(const [k,col] of [['name','name'],['company_name','company_name'],['email','email'],['mobile','mobile'],['active','active']]) if(d[k]!==undefined){fields.push(`${col}=?`);vals.push(k==='email'?d[k].toLowerCase():d[k]);}
  if(fields.length){vals.push(id);await query(`UPDATE customer_accounts SET ${fields.join(',')} WHERE id=?`,vals);}
  await log(req,'customer_updated','customer',id,d);res.json({success:true});
}));
router.delete('/customers/:id',ownerOnly,asyncHandler(async(req,res)=>{
  await query('UPDATE customer_accounts SET active=0 WHERE id=?',[req.params.id]);
  await log(req,'customer_deactivated','customer',req.params.id);res.json({success:true});
}));

router.get('/products',asyncHandler(async(req,res)=>{
  const q=`%${String(req.query.q||'').slice(0,100)}%`;
  res.json(await query(`SELECT p.id,p.name,p.slug,p.model_number,p.category_id,p.subcategory_id,p.hp_rating,p.phase,p.availability,p.is_featured,p.is_active,p.needs_review,p.source_name,p.updated_at,c.name category_name,
    (SELECT GROUP_CONCAT(b.name ORDER BY b.name SEPARATOR ', ') FROM product_brands pb JOIN brands b ON b.id=pb.brand_id WHERE pb.product_id=p.id) brands
    FROM products p JOIN categories c ON c.id=p.category_id WHERE p.deleted_at IS NULL AND (p.name LIKE ? OR c.name LIKE ?) ORDER BY p.updated_at DESC LIMIT 200`,[q,q]));
}));
router.get('/products/:id',asyncHandler(async(req,res)=>{
  const rows=await query('SELECT * FROM products WHERE id=? AND deleted_at IS NULL',[req.params.id]);
  if(!rows[0]) throw new HttpError(404,'Product not found');
  const [images,specs,brandRows]=await Promise.all([
    query('SELECT id,image_url,alt_text,display_order,is_primary FROM product_images WHERE product_id=? ORDER BY display_order',[req.params.id]),
    query('SELECT spec_name,spec_value,needs_review FROM product_specifications WHERE product_id=? ORDER BY display_order',[req.params.id]),
    query('SELECT brand_id FROM product_brands WHERE product_id=?',[req.params.id])
  ]);
  res.json({...rows[0],images,specifications:specs,brandIds:brandRows.map(r=>r.brand_id)});
}));
router.get('/catalogue-review',asyncHandler(async(_req,res)=>res.json(await query(`SELECT r.id,r.import_batch,r.sheet_name,r.\`row_number\`,r.source_data,r.review_reason,r.imported_product_id,p.name product_name
  FROM catalogue_import_rows r LEFT JOIN products p ON p.id=r.imported_product_id WHERE r.review_reason IS NOT NULL ORDER BY r.created_at DESC,r.\`row_number\` LIMIT 500`))));
router.patch('/catalogue-review/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const rows=await query('SELECT imported_product_id FROM catalogue_import_rows WHERE id=?',[req.params.id]);
  if(!rows[0]) throw new HttpError(404,'Import row not found');
  if(req.body.resolve&&rows[0].imported_product_id) await query('UPDATE products SET needs_review=0 WHERE id=?',[rows[0].imported_product_id]);
  await query('UPDATE catalogue_import_rows SET review_reason=NULL WHERE id=?',[req.params.id]);
  await log(req,'catalogue_row_reviewed','catalogue_import_row',req.params.id,{imported_product_id:rows[0].imported_product_id});
  res.json({success:true});
}));

const productSchema=z.object({name:z.string().trim().min(2).max(240),category_id:z.coerce.number().int().positive(),subcategory_id:z.coerce.number().int().positive().nullable().optional(),
  model_number:z.string().max(120).optional().or(z.literal('')),description:z.string().max(10000).optional().or(z.literal('')),hp_rating:z.string().max(100).optional().or(z.literal('')),
  phase:z.string().max(80).optional().or(z.literal('')),body_material:z.string().max(100).optional().or(z.literal('')),stage_type:z.string().max(100).optional().or(z.literal('')),
  application_type:z.string().max(100).optional().or(z.literal('')),availability:z.string().max(100).optional().or(z.literal('')),specifications:z.any().optional(),brandIds:z.array(z.coerce.number().int().positive()).optional(),
  is_featured:z.coerce.boolean().optional(),is_active:z.coerce.boolean().optional(),seo_title:z.string().max(255).optional().or(z.literal('')),seo_description:z.string().max(320).optional().or(z.literal(''))});

async function saveProduct(req,id=null) {
  const d=productSchema.parse(req.body); const slugValue=slug(req.body.slug||d.name);
  const category=await query('SELECT id FROM categories WHERE id=? AND is_active=1 AND deleted_at IS NULL',[d.category_id]);
  if(!category[0]) throw new HttpError(400,'Choose an active product category.');
  if(d.subcategory_id){const sub=await query('SELECT id FROM subcategories WHERE id=? AND category_id=? AND is_active=1 AND deleted_at IS NULL',[d.subcategory_id,d.category_id]);if(!sub[0])throw new HttpError(400,'The selected subcategory does not belong to this category.');}
  const specs=Array.isArray(d.specifications)?d.specifications:[];
  const cleanSpecs=specs.filter(s=>s?.name||s?.spec_name).map(s=>[s.name||s.spec_name,String(s.value??s.spec_value??'')]);
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    let productId=id;
    const values=[d.category_id,d.subcategory_id||null,d.name,slugValue,d.model_number||null,d.description||null,d.hp_rating||null,d.phase||null,d.body_material||null,d.stage_type||null,d.application_type||null,d.availability||null,JSON.stringify(d.specifications||[]),d.is_featured?1:0,d.is_active===false?0:1,d.seo_title||null,d.seo_description||null];
    if(id) await conn.execute(`UPDATE products SET category_id=?,subcategory_id=?,name=?,slug=?,model_number=?,description=?,hp_rating=?,phase=?,body_material=?,stage_type=?,application_type=?,availability=?,specifications=?,is_featured=?,is_active=?,seo_title=?,seo_description=?,needs_review=0 WHERE id=?`,[...values,id]);
    else { const [r]=await conn.execute(`INSERT INTO products(category_id,subcategory_id,name,slug,model_number,description,hp_rating,phase,body_material,stage_type,application_type,availability,specifications,is_featured,is_active,seo_title,seo_description)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,values); productId=r.insertId; }
    await conn.execute('DELETE FROM product_brands WHERE product_id=?',[productId]);
    for(const brandId of d.brandIds||[]) await conn.execute('INSERT IGNORE INTO product_brands(product_id,brand_id) VALUES(?,?)',[productId,brandId]);
    await conn.execute('DELETE FROM product_specifications WHERE product_id=?',[productId]);
    for(let i=0;i<cleanSpecs.length;i++) await conn.execute('INSERT INTO product_specifications(product_id,spec_name,spec_value,display_order) VALUES(?,?,?,?)',[productId,cleanSpecs[i][0],cleanSpecs[i][1],i]);
    await conn.execute('UPDATE catalogue_import_rows SET review_reason=NULL WHERE imported_product_id=?',[productId]);
    await conn.commit(); return productId;
  } catch(err){await conn.rollback();throw err;}finally{conn.release();}
}
router.post('/products',ownerOrManager,asyncHandler(async(req,res)=>{const id=await saveProduct(req);await log(req,'product_created','product',id);res.status(201).json({id});}));
router.put('/products/:id',ownerOrManager,asyncHandler(async(req,res)=>{const id=await saveProduct(req,Number(req.params.id));await log(req,'product_updated','product',id);res.json({id});}));
router.delete('/products/:id',ownerOrManager,asyncHandler(async(req,res)=>{await query('UPDATE products SET deleted_at=NOW(),is_active=0 WHERE id=? AND deleted_at IS NULL',[req.params.id]);await log(req,'product_deleted','product',req.params.id);res.json({success:true});}));
router.post('/products/:id/images',ownerOrManager,upload.array('images',8),verifyImageUploads,asyncHandler(async(req,res)=>{
  const files=req.files||[];
  if(!files.length) throw new HttpError(400,'Select a JPG, PNG or WebP image no larger than the upload limit.');
  const existing=await query('SELECT COUNT(*) n, COALESCE(MAX(display_order),-1) last_order FROM product_images WHERE product_id=?',[req.params.id]);
  const start=(existing[0]?.last_order??-1)+1;
  const hasPrimary=(existing[0]?.n||0)>0;
  const images=[];
  for(let i=0;i<files.length;i++){
    const url=await storeAsset(files[i]);
    await query('INSERT INTO product_images(product_id,image_url,alt_text,display_order,is_primary) VALUES(?,?,?,?,?)',[req.params.id,url,req.body.alt_text||null,start+i,!hasPrimary&&i===0?1:0]);
    images.push(url);
  }
  await log(req,'product_images_uploaded','product',req.params.id,{count:files.length});
  res.status(201).json({images});
}));
router.post('/assets',ownerOrManager,upload.single('image'),verifyImageUploads,asyncHandler(async(req,res)=>{
  if(!req.file) throw new HttpError(400,'Select a JPG, PNG or WebP image no larger than the upload limit.');
  res.status(201).json({url:await storeAsset(req.file)});
}));
router.delete('/product-images/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const rows=await query('SELECT image_url FROM product_images WHERE id=?',[req.params.id]);
  if(!rows[0]) throw new HttpError(404,'Image not found');
  await query('DELETE FROM product_images WHERE id=?',[req.params.id]);
  await deleteAsset(rows[0].image_url);
  res.json({success:true});
}));

router.get('/categories',asyncHandler(async(_req,res)=>{
  const categories=await query(`SELECT c.*,(SELECT COUNT(*) FROM subcategories s WHERE s.category_id=c.id AND s.is_active=1) subcategory_count FROM categories c WHERE c.deleted_at IS NULL ORDER BY c.display_order,c.name`);
  const subcategories=await query('SELECT id,category_id,name,slug,description,display_order,is_active,needs_review FROM subcategories WHERE is_active=1 AND deleted_at IS NULL ORDER BY display_order,name');
  res.json(categories.map(c=>({...c,subcategories:subcategories.filter(s=>s.category_id===c.id)})));
}));
router.post('/categories',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(160),description:z.string().max(3000).optional(),image_url:z.string().max(500).optional(),display_order:z.coerce.number().int().optional(),is_featured:z.coerce.boolean().optional()}).parse(req.body);
  const r=await query('INSERT INTO categories(name,slug,description,image_url,display_order,is_featured) VALUES(?,?,?,?,?,?)',[d.name,slug(d.name),d.description||null,d.image_url||null,d.display_order||0,d.is_featured?1:0]);await log(req,'category_created','category',r.insertId);res.status(201).json({id:r.insertId});
}));
router.put('/categories/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(160),description:z.string().max(3000).optional(),image_url:z.string().max(500).optional(),display_order:z.coerce.number().int().optional(),is_featured:z.coerce.boolean().optional(),is_active:z.coerce.boolean().optional()}).parse(req.body);
  await query('UPDATE categories SET name=?,slug=?,description=?,image_url=?,display_order=?,is_featured=?,is_active=? WHERE id=?',[d.name,slug(d.name),d.description||null,d.image_url||null,d.display_order||0,d.is_featured?1:0,d.is_active===false?0:1,req.params.id]);await log(req,'category_updated','category',req.params.id);res.json({success:true});
}));
router.delete('/categories/:id',ownerOrManager,asyncHandler(async(req,res)=>{await query('UPDATE categories SET deleted_at=NOW(),is_active=0 WHERE id=?',[req.params.id]);await log(req,'category_archived','category',req.params.id);res.json({success:true});}));
router.get('/subcategories',asyncHandler(async(_req,res)=>res.json(await query('SELECT s.*,c.name category_name FROM subcategories s JOIN categories c ON c.id=s.category_id WHERE s.deleted_at IS NULL ORDER BY c.display_order,s.display_order,s.name'))));
router.post('/subcategories',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(180),category_id:z.coerce.number().int().positive(),description:z.string().max(3000).optional()}).parse(req.body);
  const r=await query('INSERT INTO subcategories(category_id,name,slug,description) VALUES(?,?,?,?)',[d.category_id,d.name,slug(d.name),d.description||null]);await log(req,'subcategory_created','subcategory',r.insertId);res.status(201).json({id:r.insertId});
}));
router.put('/subcategories/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(2).max(180),category_id:z.coerce.number().int().positive(),description:z.string().max(3000).optional(),is_active:z.coerce.boolean().optional()}).parse(req.body);
  const category=await query('SELECT id FROM categories WHERE id=? AND deleted_at IS NULL',[d.category_id]);if(!category[0])throw new HttpError(400,'Choose an active category.');
  await query('UPDATE subcategories SET category_id=?,name=?,slug=?,description=?,is_active=? WHERE id=? AND deleted_at IS NULL',[d.category_id,d.name,slug(d.name),d.description||null,d.is_active===false?0:1,req.params.id]);await log(req,'subcategory_updated','subcategory',req.params.id);res.json({success:true});
}));
router.delete('/subcategories/:id',ownerOrManager,asyncHandler(async(req,res)=>{await query('UPDATE subcategories SET deleted_at=NOW(),is_active=0 WHERE id=? AND deleted_at IS NULL',[req.params.id]);await log(req,'subcategory_archived','subcategory',req.params.id);res.json({success:true});}));

router.get('/brands',asyncHandler(async(_req,res)=>res.json(await query(`SELECT b.*,GROUP_CONCAT(DISTINCT cb.category_id) category_ids FROM brands b LEFT JOIN category_brands cb ON cb.brand_id=b.id WHERE b.deleted_at IS NULL GROUP BY b.id ORDER BY b.name`))));
router.post('/brands',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(1).max(140),description:z.string().max(3000).optional(),logo_url:z.string().max(500).optional(),categoryIds:z.array(z.coerce.number().positive()).optional()}).parse(req.body);
  const r=await query('INSERT INTO brands(name,slug,description,logo_url) VALUES(?,?,?,?)',[d.name,slug(d.name),d.description||null,d.logo_url||null]);for(const cat of d.categoryIds||[]) await query('INSERT IGNORE INTO category_brands(category_id,brand_id) VALUES(?,?)',[cat,r.insertId]);await log(req,'brand_created','brand',r.insertId);res.status(201).json({id:r.insertId});
}));
router.put('/brands/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({name:z.string().trim().min(1).max(140),description:z.string().max(3000).optional(),logo_url:z.string().max(500).optional(),is_active:z.coerce.boolean().optional(),categoryIds:z.array(z.coerce.number().positive()).optional()}).parse(req.body);
  await query('UPDATE brands SET name=?,slug=?,description=?,logo_url=?,is_active=? WHERE id=?',[d.name,slug(d.name),d.description||null,d.logo_url||null,d.is_active===false?0:1,req.params.id]);
  if(d.categoryIds){await query('DELETE FROM category_brands WHERE brand_id=?',[req.params.id]);for(const cat of d.categoryIds) await query('INSERT IGNORE INTO category_brands(category_id,brand_id) VALUES(?,?)',[cat,req.params.id]);}
  await log(req,'brand_updated','brand',req.params.id);res.json({success:true});
}));
router.delete('/brands/:id',ownerOrManager,asyncHandler(async(req,res)=>{await query('UPDATE brands SET deleted_at=NOW(),is_active=0 WHERE id=?',[req.params.id]);await log(req,'brand_archived','brand',req.params.id);res.json({success:true});}));

router.get('/enquiries',asyncHandler(async(req,res)=>{
  const status=req.query.status; const rows=await query(`SELECT e.*,a.name assigned_name FROM enquiries e LEFT JOIN admins a ON a.id=e.assigned_admin_id WHERE e.deleted_at IS NULL ${status?'AND e.status=?':''} ORDER BY e.created_at DESC LIMIT 500`,status?[status]:[]);
  const ids=rows.map(x=>x.id);const notes=ids.length?await query(`SELECT n.*,a.name admin_name FROM enquiry_notes n JOIN admins a ON a.id=n.admin_id WHERE n.enquiry_id IN (${ids.map(()=>'?').join(',')}) ORDER BY n.created_at`,ids):[];
  const attachments=ids.length?await query(`SELECT id,enquiry_id,file_url,original_name,mime_type,file_size FROM enquiry_attachments WHERE enquiry_id IN (${ids.map(()=>'?').join(',')})`,ids):[];
  res.json(rows.map(e=>({...e,notes:notes.filter(n=>n.enquiry_id===e.id),attachments:attachments.filter(a=>a.enquiry_id===e.id)})));
}));
router.patch('/enquiries/:id',asyncHandler(async(req,res)=>{
  const d=z.object({status:z.enum(['New','Contacted','Quotation Sent','Follow-up','Converted','Closed']).optional(),assigned_admin_id:z.coerce.number().positive().nullable().optional(),note:z.string().trim().max(4000).optional()}).parse(req.body);
  if(d.status) await query('UPDATE enquiries SET status=? WHERE id=?',[d.status,req.params.id]);
  if(d.assigned_admin_id!==undefined) await query('UPDATE enquiries SET assigned_admin_id=? WHERE id=?',[d.assigned_admin_id,req.params.id]);
  if(d.note) await query('INSERT INTO enquiry_notes(enquiry_id,admin_id,note) VALUES(?,?,?)',[req.params.id,req.admin.id,d.note]);
  await log(req,'enquiry_updated','enquiry',req.params.id,{status:d.status});res.json({success:true});
}));
router.delete('/enquiries/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  await query('UPDATE enquiries SET deleted_at=NOW() WHERE id=? AND deleted_at IS NULL',[req.params.id]);
  await log(req,'enquiry_deleted','enquiry',req.params.id);res.json({success:true});
}));
router.get('/enquiries.csv',asyncHandler(async(_req,res)=>{
  const rows=await query('SELECT reference_no,customer_name,company_name,mobile,email,category_name,product_name,brand_preference,quantity,specifications,message,status,created_at FROM enquiries WHERE deleted_at IS NULL ORDER BY created_at DESC');
  const keys=Object.keys(rows[0]||{reference_no:'',customer_name:''});const esc=v=>{let value=String(v??'');if(/^[=+@\-\t\r]/.test(value))value=`'${value}`;return `"${value.replaceAll('"','""')}"`;};
  res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="lakshmi-enquiries.csv"');res.send([keys.map(esc).join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\r\n'));
}));

router.get('/settings',ownerOnly,asyncHandler(async(_req,res)=>{const rows=await query('SELECT setting_key,setting_value,is_private FROM website_settings');res.json(Object.fromEntries(rows.map(r=>[r.setting_key,{value:r.setting_value,is_private:!!r.is_private}])));}));
router.put('/settings',ownerOnly,asyncHandler(async(req,res)=>{
  const entries=Object.entries(req.body||{}); if(entries.length>100) throw new HttpError(400,'Too many settings');
  for(const [key,value] of entries) {if(!/^[a-z0-9_]{1,120}$/i.test(key)||typeof value!=='string'||value.length>5000) throw new HttpError(400,'Invalid setting');
    const privateKeys=/^(bank_|.*account|.*ifsc)/i.test(key);
    await query('INSERT INTO website_settings(setting_key,setting_value,is_private) VALUES(?,?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value),is_private=VALUES(is_private)',[key,value,privateKeys?1:0]);}
  await log(req,'settings_updated','settings',null,{keys:entries.map(([k])=>k)});res.json({success:true});
}));
router.get('/content',asyncHandler(async(_req,res)=>res.json(await query('SELECT * FROM page_contents ORDER BY page_key'))));
router.put('/content/:key',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({title:z.string().trim().min(1).max(240),body:z.string().max(30000).optional(),meta_title:z.string().max(255).optional(),meta_description:z.string().max(320).optional()}).parse(req.body);
  await query(`INSERT INTO page_contents(page_key,title,body,meta_title,meta_description,updated_by) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE title=VALUES(title),body=VALUES(body),meta_title=VALUES(meta_title),meta_description=VALUES(meta_description),updated_by=VALUES(updated_by)`,[req.params.key,d.title,d.body||'',d.meta_title||null,d.meta_description||null,req.admin.id]);await log(req,'content_updated','page',null,{key:req.params.key});res.json({success:true});
}));
router.get('/banners',asyncHandler(async(_req,res)=>res.json(await query('SELECT * FROM banners ORDER BY display_order,id'))));
router.post('/banners',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({title:z.string().trim().min(1).max(200),subtitle:z.string().max(320).optional(),image_url:z.string().max(500).optional(),cta_label:z.string().max(80).optional(),cta_url:z.string().max(500).optional(),display_order:z.coerce.number().int().optional(),is_active:z.coerce.boolean().optional()}).parse(req.body);
  const r=await query('INSERT INTO banners(title,subtitle,image_url,cta_label,cta_url,display_order,is_active) VALUES(?,?,?,?,?,?,?)',[d.title,d.subtitle||null,d.image_url||null,d.cta_label||null,d.cta_url||null,d.display_order||0,d.is_active===false?0:1]);await log(req,'banner_created','banner',r.insertId);res.status(201).json({id:r.insertId});
}));
router.put('/banners/:id',ownerOrManager,asyncHandler(async(req,res)=>{
  const d=z.object({title:z.string().trim().min(1).max(200),subtitle:z.string().max(320).optional(),image_url:z.string().max(500).optional(),cta_label:z.string().max(80).optional(),cta_url:z.string().max(500).optional(),display_order:z.coerce.number().int().optional(),is_active:z.coerce.boolean().optional()}).parse(req.body);
  await query('UPDATE banners SET title=?,subtitle=?,image_url=?,cta_label=?,cta_url=?,display_order=?,is_active=? WHERE id=?',[d.title,d.subtitle||null,d.image_url||null,d.cta_label||null,d.cta_url||null,d.display_order||0,d.is_active===false?0:1,req.params.id]);await log(req,'banner_updated','banner',req.params.id);res.json({success:true});
}));
router.delete('/banners/:id',ownerOrManager,asyncHandler(async(req,res)=>{await query('DELETE FROM banners WHERE id=?',[req.params.id]);await log(req,'banner_deleted','banner',req.params.id);res.json({success:true});}));
router.get('/activity',asyncHandler(async(_req,res)=>res.json(await query('SELECT l.*,a.name admin_name FROM admin_activity_logs l LEFT JOIN admins a ON a.id=l.admin_id ORDER BY l.created_at DESC LIMIT 200'))));

export default router;
