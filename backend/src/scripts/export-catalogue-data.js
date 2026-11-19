import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCatalogueBuffer } from '../utils/catalogueMatrix.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const input = process.argv[2];
const output = process.argv[3] || path.resolve(here, '../../../frontend/src/data/catalogue.json');
if (!input) {
  console.error('Usage: npm run export:catalogue -- <path-to-workbook.xlsx> [output.json]');
  process.exit(1);
}

const parsed = parseCatalogueBuffer(readFileSync(input));
const payload = {
  source: path.basename(input),
  source_rows: parsed.sourceRowCount,
  categories: parsed.categories,
  brands: parsed.brands,
  products: parsed.products.map(({ source_data, source_rows, source_key, source_name, needs_review, ...product }) => product),
};
mkdirSync(path.dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ output, rows: parsed.sourceRowCount, categories: parsed.categories.length, brands: parsed.brands.length, products: parsed.products.length }, null, 2));
