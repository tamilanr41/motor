import { createHash } from 'node:crypto';
import xlsx from 'xlsx';
import { slug } from './http.js';

const categoryDefinitions = [
  { name: 'Pumps', slug: 'pumps', description: 'Pumps and pumping equipment listed in the supplied catalogue.', order: 1, featured: true },
  { name: 'Electric Motors', slug: 'electric-motors', description: 'Electric motors, drives and motor accessories.', order: 2, featured: true },
  { name: 'Plumbing & Hardware', slug: 'plumbing-hardware', description: 'Pipes, fittings, valves, hoses and hardware supplies.', order: 3, featured: true },
  { name: 'Sanitary Ware', slug: 'sanitary-ware', description: 'Sanitary ware and plumbing fixtures.', order: 4, featured: true },
  { name: 'Home Appliances', slug: 'home-appliances', description: 'Home appliance products and stabilizers.', order: 5, featured: false },
  { name: 'Fans', slug: 'fans', description: 'Ceiling, wall mounted and industrial fans.', order: 6, featured: true },
  { name: 'Lights', slug: 'lights', description: 'Tube, LED and focus or flood lighting.', order: 7, featured: true },
  { name: 'Engines', slug: 'engines', description: 'Petrol and diesel engines and engine pump sets.', order: 8, featured: false },
  { name: 'Electrical Goods', slug: 'electrical-goods', description: 'Electrical accessories, controls, panels and drives.', order: 9, featured: true },
  { name: 'Gear Boxes', slug: 'gear-boxes', description: 'Gear boxes and transmission equipment.', order: 10, featured: false },
  { name: 'Power Tools', slug: 'power-tools', description: 'Power tools and workshop equipment.', order: 11, featured: true },
  { name: 'Generators', slug: 'generators', description: 'Petrol and diesel generator sets.', order: 12, featured: false },
  { name: 'Air Compressors', slug: 'air-compressors', description: 'Air compressors and compressor pumps.', order: 13, featured: false },
];

const rowCategory = (rowNumber) => {
  if (rowNumber >= 18 && rowNumber <= 191) return 'pumps';
  if (rowNumber >= 192 && rowNumber <= 198) return 'engines';
  if (rowNumber >= 199 && rowNumber <= 204) return 'air-compressors';
  if (rowNumber >= 205 && rowNumber <= 210) return 'electric-motors';
  if (rowNumber >= 211 && rowNumber <= 212) return 'gear-boxes';
  if (rowNumber === 213) return 'electrical-goods';
  if (rowNumber >= 214 && rowNumber <= 221) return 'power-tools';
  if (rowNumber >= 222 && rowNumber <= 226) return 'generators';
  if (rowNumber >= 228 && rowNumber <= 239) return 'power-tools';
  if (rowNumber >= 241 && rowNumber <= 263) return 'plumbing-hardware';
  if (rowNumber >= 265 && rowNumber <= 277) return 'sanitary-ware';
  if (rowNumber >= 278 && rowNumber <= 279) return 'sanitary-ware';
  if (rowNumber >= 281 && rowNumber <= 286) return 'plumbing-hardware';
  if (rowNumber >= 287 && rowNumber <= 287) return 'electrical-goods';
  if (rowNumber >= 288 && rowNumber <= 290) return 'lights';
  if (rowNumber === 296 || rowNumber === 307) return 'home-appliances';
  if (rowNumber >= 291 && rowNumber <= 297) return 'electrical-goods';
  if (rowNumber >= 298 && rowNumber <= 306) return 'fans';
  if (rowNumber === 307) return 'home-appliances';
  return null;
};

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const normalize = (value) => clean(value).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const phasePattern = /^(SINGLE PHASE|THREE PHASE|PETROL(?: TYPE)?|DIESEL(?: TYPE)?|ELECTRONIC TYPE)$/i;
const isPhase = (value) => phasePattern.test(clean(value));
const isNumericVariant = (value) => /\d/.test(clean(value)) && /(HP|KVA|INCH|LIT|LITER|LITRE|V\d+|\bTO\b)/i.test(clean(value));
const isCustomVariant = (value) => /AS PER CUSTOMIS[EA]/i.test(clean(value));
const isVariant = (value) => isNumericVariant(value) || isCustomVariant(value);
const isBroadHeader = (value) => new Set([
  'FAN', 'POWER TOOLS', 'ELECTRICAL GOODS', 'PLUMBING GOODS', 'HARDWARE GOODS', 'SANITARY GOODS', 'WATER STORAGE TANK',
]).has(normalize(value));
const isProductNoun = (value) => /\b(PUMP|MOTOR|GEAR BOX|VFD|MACHINE|GRINDER|POLISHER|LATHE|GENERATOR|COMPRESSOR|PIPE|PIPES|FITTING|FITTINGS|HOSE|CLAMP|COVER|ROPE|VALVE|METER|TOILET|SINK|MIXER|URINAL|BASIN|TANK|TAPE|COCK|FAUCET|LIGHT|WIRE|WIRES|SWITCH|SWITCHES|MCB|BOARD|CONTROLLER|STARTER|FAN|STABLIZER|STABILIZER|WATER HEATER)\b/i.test(clean(value));

function displayText(value) {
  return clean(value)
    .replace(/\s*[-–—]+\s*/g, ' — ')
    .replace(/\b(\d+(?:\.\d+)?)\s*HP\b/gi, '$1 HP')
    .replace(/\b(\d+(?:\.\d+)?)\s*KVA\b/gi, '$1 kVA')
    .replace(/\b(\d+)\s*INCH(?:ES)?\b/gi, '$1 in')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCase(value) {
  const text = displayText(value).toLowerCase().replace(/(^|[\s—/])([a-z])/g, (_m, lead, letter) => `${lead}${letter.toUpperCase()}`);
  return text.replace(/\b(Pvc|Upvc|Cpvc|Hdpe|Mcb|Vfd|Led|Stp|Etp|Ci|Al|Hp|Kva)\b/g, (m) => ({
    Pvc: 'PVC', Upvc: 'UPVC', Cpvc: 'CPVC', Hdpe: 'HDPE', Mcb: 'MCB', Vfd: 'VFD', Led: 'LED', Stp: 'STP', Etp: 'ETP', Ci: 'CI', Al: 'AL', Hp: 'HP', Kva: 'kVA',
  })[m] || m).replace(/\bVaccum\b/g, 'Vacuum').replace(/\bStablizer\b/g, 'Stabilizer').replace(/\bPiller Cock\b/g, 'Pillar Cock').replace(/\bAdopter\b/g, 'Adapter');
}

function splitBrands(values) {
  const brands = [];
  const availability = [];
  for (const source of values) {
    let cell = clean(source);
    if (!cell) continue;
    cell = cell.replace(/TEXMO\s*[-–]\s*AQUATEX/gi, 'TEXMO, AQUATEX');
    for (const raw of cell.split(/[,/;|]+/)) {
      const label = clean(raw).replace(/\s*[-–]+\s*/g, '-');
      if (!label) continue;
      const key = normalize(label);
      if (/ECONOMIC.*ON REQUEST|ON REQUEST/.test(key)) { availability.push('Economic option on request'); continue; }
      if (key === 'ECONOMIC') { availability.push('Economic option listed'); continue; }
      if (key === 'IMPORTED') { availability.push('Imported option listed'); continue; }
      const display = key === 'VGUARD' ? 'V-GUARD' : key === 'DE WALT' ? 'DEWALT' : label.toUpperCase();
      if (!brands.some((b) => normalize(b) === normalize(display))) brands.push(display);
    }
  }
  return { brands, availability: [...new Set(availability)] };
}

function hpValue(text) {
  const m = clean(text).match(/\d+(?:\.\d+)?\s*HP(?:\s*(?:TO|[-–])\s*\d+(?:\.\d+)?\s*HP)?|\d+(?:\.\d+)?\s*(?:TO|[-–])\s*\d+(?:\.\d+)?\s*HP/i);
  return m ? displayText(m[0]).replace(/\bHP\b/i, 'HP') : '';
}

function variantDetails(value, phase) {
  const text = displayText(value);
  const specs = [];
  const hp = hpValue(text);
  if (hp) specs.push({ name: 'Capacity', value: hp });
  const kva = text.match(/\d+(?:\.\d+)?\s*KVA(?:\s*(?:TO|[-–])\s*\d+(?:\.\d+)?\s*KVA)?|\d+(?:\.\d+)?\s*(?:TO|[-–])\s*\d+(?:\.\d+)?\s*KVA/i);
  if (kva && !hp) specs.push({ name: 'Capacity', value: displayText(kva[0]) });
  const body = /\bCI BODY\b/i.test(text) ? 'CI body' : /\bAL BODY\b/i.test(text) ? 'AL body' : '';
  if (body) specs.push({ name: 'Body', value: body });
  const stage = text.match(/\b\d+\s*STAGE\b|\bMULTISTAGE\b/i);
  if (stage) specs.push({ name: 'Stage', value: titleCase(stage[0]) });
  const tank = text.match(/\([^)]*\)/);
  if (tank) specs.push({ name: 'Tank', value: titleCase(tank[0].slice(1, -1)) });
  if (phase && /PHASE/i.test(phase)) specs.push({ name: 'Phase', value: titleCase(phase) });
  if (phase && /PETROL|DIESEL/i.test(phase)) specs.push({ name: 'Fuel type', value: titleCase(phase.replace(/\s+TYPE$/i, '')) });
  if (/ELECTRONIC TYPE/i.test(phase)) specs.push({ name: 'Control type', value: titleCase(phase) });
  return { text, specs, hp, body, stage: stage ? titleCase(stage[0]) : '', phase: /PHASE/i.test(phase) ? titleCase(phase) : '' };
}

export function parseCatalogueMatrix(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false, blankrows: true });
  const categories = categoryDefinitions.map((category) => ({ ...category, brands: new Set() }));
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const categoryMaster = [];
  for (let rowNumber = 2; rowNumber <= 14; rowNumber += 1) {
    const row = rows[rowNumber - 1] || [];
    const name = clean(row[1]);
    const categoryDefinition = categoryDefinitions.find((item) => {
      const key = normalize(item.name);
      return key === normalize(name) || (item.slug === 'electric-motors' && normalize(name) === 'ELECTRIC MOTOR') ||
        (item.slug === 'home-appliances' && normalize(name) === 'HOME APPLIANCE') ||
        (item.slug === 'gear-boxes' && normalize(name) === 'GEAR BOX') ||
        (item.slug === 'air-compressors' && normalize(name) === 'AIR COMPRESSOR') ||
        (item.slug === 'engines' && normalize(name) === 'ENGINE') ||
        (item.slug === 'generators' && normalize(name) === 'GENERATOR') ||
        (item.slug === 'fans' && normalize(name) === 'FAN') ||
        (item.slug === 'lights' && normalize(name) === 'LIGHT');
    });
    if (!categoryDefinition) continue;
    const category = categoryBySlug.get(categoryDefinition.slug);
    const parsed = splitBrands(row.slice(2));
    parsed.brands.forEach((brand) => category.brands.add(brand));
    categoryMaster.push({ categorySlug: category.slug, rowNumber, brands: parsed.brands, source: row });
  }

  const products = [];
  const sourceRows = [];
  for (const category of categoryMaster) sourceRows.push({ rowNumber: category.rowNumber, row: category.source, categorySlug: category.categorySlug, product: null });
  const subcategoryNames = new Map();
  let family = '';
  let qualifier = '';
  let phase = '';
  let currentCategorySlug = '';
  const consumed = new Set();
  const broadParents = new Set(['POWER TOOLS', 'PLUMBING GOODS', 'HARDWARE GOODS', 'SANITARY GOODS', 'ELECTRICAL GOODS', 'WATER STORAGE TANK', 'FAN']);
  const knownBrands = new Set();
  for (const category of categoryMaster) for (const brand of category.brands) knownBrands.add(normalize(brand));
  for (const row of rows.slice(17)) for (const brand of splitBrands((row || []).slice(3)).brands) knownBrands.add(normalize(brand));
  const cleanVariant = (value) => titleCase(displayText(value)
    .replace(/(\d+(?:\.\d+)?\s*HP)\s*—\s*(\d+(?:\.\d+)?\s*HP)/gi, '$1 to $2')
    .replace(/(\d+(?:\.\d+)?)\s*—\s*(\d+(?:\.\d+)?\s*HP)/gi, '$1 to $2')
    .replace(/\.{2,}/g, ' ').replace(/-{2,}/g, ' ').replace(/\s+/g, ' '));

  function buildProduct({ rowNumber, sourceRowNumbers, categorySlug, variant, inlineLabel, brandCells }) {
    const category = categoryBySlug.get(categorySlug);
    if (!category) return null;
    const parsedBrands = splitBrands(brandCells);
    parsedBrands.brands.forEach((brand) => category.brands.add(brand));
    const familyName = titleCase(family);
    const qualifierName = titleCase(qualifier);
    const phaseName = titleCase(phase);
    let baseName;
    let subcategoryName;

    if (inlineLabel) {
      let itemLabel = titleCase(inlineLabel);
      if (category.slug === 'fans' && !/FAN|AIR CURTAIN/i.test(itemLabel)) itemLabel = `${itemLabel} Fan`;
      const inlineKey = normalize(inlineLabel);
      const familyKey = normalize(family);
      const isWithinBroadParent = broadParents.has(familyKey);
      if (isWithinBroadParent || isProductNoun(inlineLabel)) {
        baseName = familyKey === 'WATER STORAGE TANK' ? `${familyName} — ${itemLabel}` : itemLabel;
        subcategoryName = isWithinBroadParent ? itemLabel : (qualifierName || familyName);
      } else {
        baseName = [familyName, itemLabel].filter(Boolean).join(' — ');
        subcategoryName = qualifierName ? [familyName, qualifierName].join(' — ') : familyName;
      }
    } else {
      const prefix = [familyName, qualifierName && normalize(qualifierName) !== normalize(familyName) ? qualifierName : ''].filter(Boolean).join(' — ');
      const isGenericCapacity = isVariant(variant);
      baseName = prefix || titleCase(variant);
      if (variant && isGenericCapacity) baseName = [baseName, cleanVariant(variant)].filter(Boolean).join(' — ');
      if (phaseName && /PHASE|PETROL|DIESEL/i.test(phaseName) && !baseName.toLowerCase().includes(phaseName.toLowerCase())) baseName += ` — ${phaseName}`;
      subcategoryName = qualifierName && !isPhase(qualifierName) ? [familyName, qualifierName].filter(Boolean).join(' — ') : familyName;
    }

    if (!baseName) return null;
    const details = variantDetails(variant || inlineLabel || '', phase);
    const rowData = sourceRowNumbers.map((row) => ({ rowNumber: row, cells: rows[row - 1] || [] }));
    const custom = /AS PER CUSTOMIS[EA]/i.test(variant || inlineLabel || '');
    const availability = parsedBrands.availability.length ? parsedBrands.availability.join('; ') : custom ? 'Custom configuration on request' : 'Confirm availability with Lakshmi Agency';
    const specifications = [...details.specs];
    if (custom) specifications.push({ name: 'Configuration', value: 'As per customer requirement' });
    if (parsedBrands.brands.length) specifications.push({ name: 'Brands listed in workbook', value: parsedBrands.brands.join(', ') });
    const description = [
      parsedBrands.brands.length ? 'Brand references reflect the supplied product catalogue.' : 'Brand options are available on enquiry.',
      custom ? 'The source list marks this item as a custom requirement.' : '',
      'Confirm the exact model, price and current availability with Lakshmi Agency.',
    ].filter(Boolean).join(' ');
    const product = {
      id: products.length + 1,
      name: baseName,
      slug: `${slug(baseName)}-r${rowNumber}`,
      category_id: categories.findIndex((item) => item.slug === categorySlug) + 1,
      category_name: category.name,
      category_slug: category.slug,
      subcategory_id: null,
      subcategory_name: subcategoryName || familyName,
      subcategory_slug: slug(subcategoryName || familyName),
      model_number: null,
      description,
      hp_rating: details.hp || null,
      phase: details.phase || null,
      body_material: details.body || null,
      stage_type: details.stage || null,
      application_type: null,
      availability,
      brands: parsedBrands.brands.join(', '),
      brand_list: parsedBrands.brands,
      specifications,
      image_url: '',
      images: [],
      is_featured: products.length < 8,
      is_active: true,
      needs_review: false,
      source_name: `${sheetName} rows ${sourceRowNumbers.join(', ')}`,
      source_key: `${sheetName}:${rowNumber}`,
      source_rows: sourceRowNumbers,
      source_data: rowData,
    };
    subcategoryNames.set(`${categorySlug}|${product.subcategory_slug}`, { categorySlug, name: product.subcategory_name, slug: product.subcategory_slug });
    products.push(product);
    return product;
  }

  for (let rowNumber = 18; rowNumber <= rows.length; rowNumber += 1) {
    if (consumed.has(rowNumber)) continue;
    const row = rows[rowNumber - 1] || [];
    const categorySlug = rowCategory(rowNumber);
    const categoryChanged = categorySlug && categorySlug !== currentCategorySlug;
    if (categoryChanged) {
      currentCategorySlug = categorySlug;
      family = '';
      qualifier = '';
      phase = '';
    }
    const b = clean(row[1]);
    let c = clean(row[2]);
    const brandCells = row.slice(3).map(clean).filter(Boolean);
    const cWasBrand = c && knownBrands.has(normalize(c));
    if (cWasBrand) {
      brandCells.unshift(c);
      c = '';
    }
    if (!b && !c && !brandCells.length) continue;

    if (b) {
      family = b;
      qualifier = '';
      phase = '';
      if (c) {
        if (isPhase(c)) phase = c;
        else if (!isVariant(c)) qualifier = c;
      }
    }

    if (!brandCells.length) {
      if (!b && c) {
        if (isPhase(c)) phase = c;
        else if (isBroadHeader(c)) { family = c; qualifier = ''; phase = ''; }
        else if (isVariant(c)) {
          // A standalone capacity is a product unless the next rows complete a range around a separate brand row.
          const next = clean(rows[rowNumber]?.[2]);
          const followsRangeConnector = /^TO$/i.test(next);
          if (!followsRangeConnector) {
            const product = buildProduct({ rowNumber, sourceRowNumbers: [rowNumber], categorySlug, variant: c, inlineLabel: '', brandCells: [] });
            sourceRows.push({ rowNumber, row, categorySlug, product });
            continue;
          }
        } else {
          const previousQualifier = qualifier;
          qualifier = c;
          if (/SEWAGE CUTTER|SUBMERSIBLE TYPE/i.test(c) || (previousQualifier && /SEWAGE/i.test(c))) phase = '';
        }
      }
      sourceRows.push({ rowNumber, row, categorySlug, product: null });
      continue;
    }

    let variant = c;
    let inlineLabel = '';
    let sourceRowNumbers = [rowNumber];
    if (c && /^TO$/i.test(c)) {
      const previous = clean(rows[rowNumber - 2]?.[2]);
      const next = clean(rows[rowNumber]?.[2]);
      if (previous && next && /\d/.test(previous) && /\d/.test(next)) {
        variant = `${previous} TO ${next}`;
        sourceRowNumbers = [rowNumber - 1, rowNumber, rowNumber + 1];
        consumed.add(rowNumber + 1);
        const last = sourceRows.at(-1);
        if (last?.rowNumber === rowNumber - 1) last.product = null;
      }
    } else if (!c) {
      const previousProduct = products.at(-1);
      const parsed = splitBrands(brandCells);
      if (!cWasBrand && previousProduct && previousProduct.category_slug === categorySlug && previousProduct.brand_list.some((brand) => parsed.brands.includes(brand))) {
        previousProduct.source_rows.push(rowNumber);
        previousProduct.source_data.push({ rowNumber, cells: row });
        sourceRows.push({ rowNumber, row, categorySlug, product: previousProduct });
        continue;
      }
      inlineLabel = qualifier || family;
    } else if (isPhase(c)) {
      phase = c;
      variant = '';
    } else if (isVariant(c)) {
      if (isBroadHeader(family) || (isProductNoun(c) && !/^\s*\d/.test(c))) {
        inlineLabel = c;
        variant = '';
      } else {
        variant = c;
      }
    } else {
      const familyKey = normalize(family);
      const categoryChangedFromFamily = categoryChanged && !b;
      if (categoryChangedFromFamily) {
        family = categoryBySlug.get(categorySlug)?.name.toUpperCase() || c;
        qualifier = '';
        phase = '';
        inlineLabel = c;
        variant = '';
      } else if (isBroadHeader(family)) {
        inlineLabel = c;
        variant = '';
      } else if (!b && isProductNoun(c)) {
        family = c;
        qualifier = '';
        phase = '';
        inlineLabel = c;
        variant = '';
      } else {
        inlineLabel = b ? [family, c].filter(Boolean).join(' — ') : c;
        variant = '';
      }
    }

    const product = buildProduct({ rowNumber, sourceRowNumbers, categorySlug, variant, inlineLabel, brandCells });
    sourceRowNumbers.forEach((sourceRowNumber) => {
      const source = rows[sourceRowNumber - 1] || [];
      sourceRows.push({ rowNumber: sourceRowNumber, row: source, categorySlug, product });
    });
  }

  const brands = new Map();
  for (const category of categories) for (const name of category.brands) brands.set(slug(name), { id: brands.size + 1, name, slug: slug(name) });
  for (const product of products) for (const name of product.brand_list) if (!brands.has(slug(name))) brands.set(slug(name), { id: brands.size + 1, name, slug: slug(name) });
  const categoryOutput = categories.map((category, index) => ({
    id: index + 1,
    name: category.name,
    slug: category.slug,
    description: category.description,
    display_order: category.order,
    is_featured: category.featured,
    product_count: products.filter((product) => product.category_slug === category.slug).length,
    brands: [...category.brands],
    subcategories: [...subcategoryNames.values()].filter((subcategory) => subcategory.categorySlug === category.slug).map((subcategory, subIndex) => ({ ...subcategory, id: subIndex + 1, category_id: index + 1 })),
  }));
  const brandOutput = [...brands.values()].map((brand) => ({
    ...brand,
    product_count: products.filter((product) => product.brand_list.some((name) => slug(name) === brand.slug)).length,
    categories: [...new Set([
      ...categoryMaster.filter((entry) => entry.brands.some((name) => slug(name) === brand.slug)).map((entry) => categoryBySlug.get(entry.categorySlug)?.name),
      ...products.filter((product) => product.brand_list.some((name) => slug(name) === brand.slug)).map((product) => product.category_name),
    ].filter(Boolean))].join(', '),
  })).sort((a, b) => a.name.localeCompare(b.name));
  return { categories: categoryOutput, brands: brandOutput, products, sourceRows, categoryMaster, sourceSheet: sheetName, sourceRowCount: rows.length };
}

export function parseCatalogueBuffer(buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer', raw: false });
  const parsed = parseCatalogueMatrix(workbook);
  return { ...parsed, batch: `catalogue-${createHash('sha256').update(buffer).digest('hex').slice(0, 16)}` };
}

