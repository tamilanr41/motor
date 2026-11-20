import catalogue from '../data/catalogue.json';

const toSlug = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * Returns the active real-time catalogue:
 * If the admin has added, edited, or removed items in the Admin Dashboard,
 * this function reads directly from the persistent admin store so that changes
 * reflect IMMEDIATELY across the customer-facing main website.
 */
export function getActiveCatalogue() {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('la_admin_store_v2') : null;
    if (raw) {
      const store = JSON.parse(raw);
      if (Array.isArray(store.products) && Array.isArray(store.categories)) {
        const activeProds = store.products
          .filter(p => p.is_active !== false)
          .map((p, idx) => {
            const cat = store.categories.find(c => Number(c.id) === Number(p.category_id));
            const sub = (store.subcategories || []).find(s => Number(s.id) === Number(p.subcategory_id));
            const brandList = Array.isArray(p.brand_list) && p.brand_list.length > 0
              ? p.brand_list
              : (p.brands ? p.brands.split(',').map(s => s.trim()).filter(Boolean) : []);

            const primaryImg = p.images?.find(i => i.is_primary)?.image_url
              || p.images?.[0]?.image_url
              || p.image_url
              || '';

            return {
              ...p,
              id: p.id || idx + 1,
              slug: p.slug || toSlug(p.name),
              category_name: p.category_name || cat?.name || 'Pumps',
              category_slug: cat?.slug || toSlug(cat?.name || p.category_name || 'pumps'),
              subcategory_name: p.subcategory_name || sub?.name || '',
              subcategory_slug: sub?.slug || toSlug(sub?.name || ''),
              brand_list: brandList,
              brands: p.brands || brandList.join(', '),
              image_url: primaryImg || p.image_url,
              images: Array.isArray(p.images) && p.images.length > 0
                ? p.images
                : (primaryImg ? [{ id: 1, image_url: primaryImg, is_primary: true }] : []),
              is_featured: Boolean(p.is_featured)
            };
          });

        const activeCats = store.categories
          .filter(c => c.is_active !== false)
          .map(c => ({
            ...c,
            slug: c.slug || toSlug(c.name),
            product_count: activeProds.filter(p => Number(p.category_id) === Number(c.id)).length
          }));

        const activeBrands = (store.brands || [])
          .filter(b => b.is_active !== false)
          .map(b => ({
            ...b,
            slug: b.slug || toSlug(b.name),
            product_count: activeProds.filter(p => p.brand_list.some(name => toSlug(name) === toSlug(b.name))).length
          }));

        const rawSettings = store.settings || {};
        const flatSettings = {
          business_name: 'Lakshmi Agency',
          phones: '80127 72734, 97872 12722, 044-45522370',
          whatsapp_number: '918012772734',
          email: 'chennailakshmiagency@gmail.com',
          address: 'Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.',
          gst_number: '33CYHPS0640F1ZM'
        };
        for (const [k, v] of Object.entries(rawSettings)) {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            flatSettings[k] = String(v.value || '');
          } else if (typeof v === 'string') {
            flatSettings[k] = v;
          } else if (v !== undefined && v !== null) {
            flatSettings[k] = String(v);
          }
        }

        return {
          categories: activeCats,
          subcategories: store.subcategories || [],
          brands: activeBrands,
          products: activeProds,
          banners: (store.banners || []).filter(b => b.is_active !== false),
          settings: flatSettings
        };
      }
    }
  } catch (err) {
    console.warn('Error reading dynamic admin store, using catalogue.json fallback:', err);
  }

  return {
    ...catalogue,
    settings: {
      business_name: 'Lakshmi Agency',
      phones: '80127 72734, 97872 12722, 044-45522370',
      whatsapp_number: '918012772734',
      email: 'chennailakshmiagency@gmail.com',
      address: 'Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.',
      gst_number: '33CYHPS0640F1ZM'
    }
  };
}

export const fallbackCatalogue = new Proxy(catalogue, {
  get(target, prop) {
    const active = getActiveCatalogue();
    if (prop in active) {
      return active[prop];
    }
    return target[prop];
  }
});

export function fallbackProducts(query = {}) {
  const active = getActiveCatalogue();
  const q = String(query.q || '').trim().toLowerCase();
  const category = String(query.category || '');
  const subcategory = String(query.subcategory || '');
  const brand = String(query.brand || '');
  let items = (active.products || []).filter((product) => {
    if (category && product.category_slug !== category) return false;
    if (subcategory && product.subcategory_slug !== subcategory) return false;
    if (brand && !(product.brand_list || []).some((name) => toSlug(name) === brand)) return false;
    if (q && ![product.name, product.brands, product.category_name, product.subcategory_name, product.hp_rating, product.phase].join(' ').toLowerCase().includes(q)) return false;
    if ((String(query.featured) === '1' || query.featured === true) && !product.is_featured) return false;
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
  const active = getActiveCatalogue();
  const product = (active.products || []).find((item) => item.slug === slug || String(item.id) === String(slug));
  if (!product) return null;
  return {
    ...product,
    images: Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (product.image_url ? [{ id: 1, image_url: product.image_url, is_primary: true }] : []),
    related: (active.products || []).filter((item) => item.category_slug === product.category_slug && item.id !== product.id).slice(0, 4),
  };
}

export function fallbackBrand(slug) {
  const active = getActiveCatalogue();
  const brand = (active.brands || []).find((item) => item.slug === slug || String(item.id) === String(slug));
  if (!brand) return null;
  return {
    ...brand,
    description: brand.description || `${brand.name} is listed in the supplied Lakshmi Agency catalogue. Contact our team to confirm current model and availability.`,
    products: (active.products || []).filter((product) => (product.brand_list || []).some((name) => toSlug(name) === slug))
  };
}

