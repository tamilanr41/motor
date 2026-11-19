import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db.js';
import { parseCatalogueBuffer } from '../utils/catalogueMatrix.js';
import { slug } from '../utils/http.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run import:catalogue -- <path-to-workbook.xlsx>');
  process.exit(1);
}

const parsed = parseCatalogueBuffer(readFileSync(file));
const workbookName = path.basename(file);
const conn = await pool.getConnection();
const categoryIds = new Map();
const productIds = new Map();
const sourceRowsByNumber = new Map();
let imported = 0;
let existing = 0;
let needsReview = 0;

const cellsToObject = (cells) => Object.fromEntries(cells.map((value, index) => [String.fromCharCode(65 + index), value ?? '']));
const getOrCreateBrand = async (name) => {
  const brandSlug = slug(name);
  const [rows] = await conn.execute('SELECT id FROM brands WHERE slug=? AND deleted_at IS NULL LIMIT 1', [brandSlug]);
  if (rows[0]) return rows[0].id;
  try {
    const [result] = await conn.execute('INSERT INTO brands(name,slug) VALUES(?,?)', [name, brandSlug]);
    return result.insertId;
  } catch (error) {
    if (error.code !== 'ER_DUP_ENTRY') throw error;
    const [retry] = await conn.execute('SELECT id FROM brands WHERE slug=? LIMIT 1', [brandSlug]);
    if (!retry[0]) throw error;
    return retry[0].id;
  }
};

try {
  await conn.beginTransaction();
  for (const category of parsed.categories) {
    const [rows] = await conn.execute('SELECT id FROM categories WHERE slug=? AND deleted_at IS NULL LIMIT 1', [category.slug]);
    let id = rows[0]?.id;
    if (!id) {
      const [result] = await conn.execute('INSERT INTO categories(name,slug,description,display_order,is_featured,is_active) VALUES(?,?,?,?,?,1)', [category.name, category.slug, category.description, category.display_order, category.is_featured ? 1 : 0]);
      id = result.insertId;
    }
    categoryIds.set(category.slug, id);
  }

  const categoryBrandIds = new Map();
  for (const category of parsed.categoryMaster) {
    const categoryId = categoryIds.get(category.categorySlug);
    for (const brandName of category.brands) {
      const brandId = await getOrCreateBrand(brandName);
      await conn.execute('INSERT IGNORE INTO category_brands(category_id,brand_id) VALUES(?,?)', [categoryId, brandId]);
      categoryBrandIds.set(`${category.categorySlug}:${brandName}`, brandId);
    }
  }

  for (const row of parsed.sourceRows) {
    const current = sourceRowsByNumber.get(row.rowNumber);
    if (!current || (!current.product && row.product)) sourceRowsByNumber.set(row.rowNumber, row);
  }

  for (const product of parsed.products) {
    const categoryId = categoryIds.get(product.category_slug);
    const subcategoryName = product.subcategory_name || product.category_name;
    const subcategorySlug = product.subcategory_slug || slug(subcategoryName);
    const [subRows] = await conn.execute('SELECT id FROM subcategories WHERE category_id=? AND slug=? AND deleted_at IS NULL LIMIT 1', [categoryId, subcategorySlug]);
    let subcategoryId = subRows[0]?.id;
    if (!subcategoryId) {
      const [result] = await conn.execute('INSERT INTO subcategories(category_id,name,slug,is_active,needs_review) VALUES(?,?,?,1,0)', [categoryId, subcategoryName, subcategorySlug]);
      subcategoryId = result.insertId;
    }

    const sourceKey = `${parsed.sourceSheet}:${product.source_key.split(':').at(-1)}`;
    const [existingRows] = await conn.execute('SELECT id FROM products WHERE source_key=? LIMIT 1', [sourceKey]);
    let productId = existingRows[0]?.id;
    if (productId) {
      existing += 1;
      needsReview += 1;
    } else {
      const sourceData = JSON.stringify(product.source_data.map((entry) => ({ rowNumber: entry.rowNumber, cells: cellsToObject(entry.cells) })));
      const [result] = await conn.execute(`INSERT INTO products(category_id,subcategory_id,name,slug,description,hp_rating,phase,body_material,stage_type,availability,specifications,source_data,source_name,source_key,is_featured,is_active,needs_review)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)`, [categoryId, subcategoryId, product.name, product.slug, product.description, product.hp_rating, product.phase, product.body_material, product.stage_type, product.availability, JSON.stringify(product.specifications), sourceData, `${workbookName} — ${parsed.sourceSheet} row ${product.source_rows.join(', ')}`, sourceKey, product.is_featured ? 1 : 0, 1]);
      productId = result.insertId;
      imported += 1;
    }
    productIds.set(product.source_key, productId);

    for (const brandName of product.brand_list) {
      const brandId = await getOrCreateBrand(brandName);
      await conn.execute('INSERT IGNORE INTO product_brands(product_id,brand_id) VALUES(?,?)', [productId, brandId]);
      await conn.execute('INSERT IGNORE INTO category_brands(category_id,brand_id) VALUES(?,?)', [categoryId, brandId]);
    }
    for (const rowNumber of product.source_rows) {
      const row = sourceRowsByNumber.get(rowNumber);
      if (row) row.productId = productId;
    }
  }

  for (const row of sourceRowsByNumber.values()) {
    const reason = row.productId ? null : 'Category, family, phase or range context used by the workbook matrix.';
    await conn.execute(`INSERT INTO catalogue_import_rows(import_batch,sheet_name,\`row_number\`,source_data,review_reason,imported_product_id)
      VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE imported_product_id=COALESCE(imported_product_id,VALUES(imported_product_id)),review_reason=COALESCE(review_reason,VALUES(review_reason))`, [parsed.batch, parsed.sourceSheet, row.rowNumber, JSON.stringify(cellsToObject(row.row)), reason, row.productId || null]);
  }
  await conn.commit();
} catch (error) {
  await conn.rollback();
  throw error;
} finally {
  conn.release();
  await pool.end();
}

console.log(JSON.stringify({
  batch: parsed.batch,
  workbook: workbookName,
  categories: categoryIds.size,
  brands: parsed.brands.length,
  sourceRows: sourceRowsByNumber.size,
  productsInWorkbook: parsed.products.length,
  productsImported: imported,
  existingProducts: existing,
  reviewRows: needsReview,
}, null, 2));
