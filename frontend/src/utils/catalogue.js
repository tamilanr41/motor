import catalogue from '../data/catalogue.json';

const toSlug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const fallbackCatalogue = catalogue;

export function fallbackProducts(query = {}) {
  const q = String(query.q || '').trim().toLowerCase();
  const category = String(query.category || '');
  const subcategory = String(query.subcategory || '');
  const brand = String(query.brand || '');
  let items = catalogue.products.filter((product) => {
    if (category && product.category_slug !== category) return false;
    if (subcategory && product.subcategory_slug !== subcategory) return false;
    if (brand && !product.brand_list.some((name) => toSlug(name) === brand)) return false;
    if (q && ![product.name, product.brands, product.category_name, product.subcategory_name, product.hp_rating, product.phase].join(' ').toLowerCase().includes(q)) return false;
    if (query.featured === '1' && !product.is_featured) return false;
    return true;
  });
  const sort = query.sort || 'featured';
  if (sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'category') items = [...items].sort((a, b) => a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name));
  else if (sort === 'newest') items = [...items].reverse();
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(48, Math.max(1, Number(query.limit || 12)));
  const total = items.length;
  return { items: items.slice((page - 1) * limit, page * limit), page, limit, total, pages: Math.ceil(total / limit) };
}

export function fallbackProduct(slug) {
  const product = catalogue.products.find((item) => item.slug === slug);
  if (!product) return null;
  return {
    ...product,
    images: [],
    related: catalogue.products.filter((item) => item.category_slug === product.category_slug && item.id !== product.id).slice(0, 4),
  };
}

export function fallbackBrand(slug) {
  const brand = catalogue.brands.find((item) => item.slug === slug);
  if (!brand) return null;
  return { ...brand, description: `${brand.name} is listed in the supplied Lakshmi Agency catalogue. Contact the team to confirm the current model and availability.`, products: catalogue.products.filter((product) => product.brand_list.some((name) => toSlug(name) === slug)) };
}

