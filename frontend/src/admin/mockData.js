import catalogueData from '../data/catalogue.json';

const STORAGE_KEY = 'la_admin_store_v2';

// Clear any legacy v1 store with dummy data
try {
  localStorage.removeItem('la_admin_store_v1');
} catch (e) {
  // ignore
}

// Initial seed data from real catalogue (NO DUMMY / FAKE ENQUIRIES)
export function getInitialStore() {
  const categories = (catalogueData.categories || []).map((c, idx) => ({
    id: c.id || idx + 1,
    name: c.name,
    slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
    description: c.description || `${c.name} available at Lakshmi Agency, Chennai.`,
    image_url: c.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    display_order: c.display_order || idx + 1,
    is_featured: c.is_featured !== false,
    is_active: true,
    subcategories: (c.subcategories || []).map((s, sidx) => ({
      id: s.id || (idx + 1) * 100 + sidx + 1,
      category_id: c.id || idx + 1,
      name: s.name,
      slug: s.slug || s.name.toLowerCase().replace(/\s+/g, '-'),
      description: s.description || '',
      display_order: sidx + 1,
      is_active: true
    }))
  }));

  const subcategories = categories.flatMap(c => 
    (c.subcategories || []).map(s => ({ ...s, category_name: c.name }))
  );

  // Real partner brands from workbook
  const rawBrands = catalogueData.brands || [
    'SENBA', 'BESTEN', 'CRI', 'CROMPTON', 'KIRLOSKAR', 'SUGUNA', 'TEXMO',
    'AQUATEX', 'TARRO', 'SAMUDRA', 'V-GUARD', 'RAMESH', 'BEST', 'LAKSHMI',
    'WILO', 'KSB', 'GRUNDFOS', 'LUBI', 'ALGO', 'HAVELLS'
  ];

  const initialBrands = rawBrands.map((b, idx) => {
    const brandName = typeof b === 'string' ? b : (b.name || `Brand ${idx + 1}`);
    return {
      id: idx + 1,
      name: brandName,
      slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Authorized dealer & supplier for ${brandName} products in Parrys, Chennai.`,
      logo_url: typeof b === 'object' && b.logo_url ? b.logo_url : '',
      is_active: true,
      category_ids: '1,2'
    };
  });

  // All 171 real products from the catalogue workbook!
  const initialProducts = (catalogueData.products || []).map((p, idx) => ({
    id: p.id || idx + 1,
    name: p.name,
    slug: p.slug,
    category_id: p.category_id || 1,
    category_name: p.category_name || 'Pumps',
    subcategory_id: p.subcategory_id || null,
    subcategory_name: p.subcategory_name || '',
    model_number: p.model_number || '',
    hp_rating: p.hp_rating || '',
    phase: p.phase || 'Single / Three Phase',
    body_material: p.body_material || 'Cast Iron / CI',
    stage_type: p.stage_type || 'Standard',
    application_type: p.application_type || 'Agricultural, Domestic & Industrial',
    availability: p.availability || 'Confirm availability with Lakshmi Agency',
    is_featured: !!p.is_featured,
    is_active: p.is_active !== false,
    needs_review: !!p.needs_review,
    brands: p.brands || '',
    brandIds: [],
    description: p.description || 'Quality industrial pump / motor from Lakshmi Agency, Parrys, Chennai.',
    specifications: Array.isArray(p.specifications) ? p.specifications : [],
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [
      { id: idx + 1, image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', is_primary: true }
    ],
    updated_at: new Date().toISOString()
  }));

  // ZERO FAKE ENQUIRIES - Starts clean! Real inquiries will appear here as they are created
  const initialEnquiries = [];

  // ZERO FAKE CUSTOMERS - Starts clean! Registered customers will appear here
  const initialCustomers = [];

  // Clean Real Banners for Lakshmi Agency
  const initialBanners = [
    {
      id: 1,
      title: 'Industrial Pumps & Electric Motors in Chennai',
      subtitle: 'Authorised Stockists & Distributors in Parrys. 40+ Years of Engineering Reliability.',
      image_url: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=1600&q=85',
      cta_label: 'Explore Catalogue',
      cta_url: '/products',
      display_order: 1,
      is_active: true
    },
    {
      id: 2,
      title: 'Agricultural Submersibles & Monobloc Motors',
      subtitle: 'Complete Range of Crompton, CRI, Kirloskar, Texmo and Suguna Pumps with Instant Quotation Support.',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=85',
      cta_label: 'Request Quotation',
      cta_url: '/quote',
      display_order: 2,
      is_active: true
    }
  ];

  const initialTeam = [
    { id: 1, name: 'Lakshmi Agency Admin', email: 'admin@lakshmiagency.com', role: 'owner', active: 1 }
  ];

  const initialSettings = {
    business_name: { value: 'Lakshmi Agency', is_private: false },
    address: { value: 'Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.', is_private: false },
    phones: { value: '80127 72734, 97872 12722, 044-45522370', is_private: false },
    email: { value: 'chennailakshmiagency@gmail.com', is_private: false },
    gst_number: { value: '33CYHPS0640F1ZM', is_private: false },
    whatsapp_number: { value: '918012772734', is_private: false },
    google_maps_query: { value: 'Lakshmi Agency Angappa Naicken Street Parrys Chennai', is_private: false },
    facebook_url: { value: 'https://facebook.com/lakshmiagencychennai', is_private: false },
    instagram_url: { value: 'https://instagram.com/lakshmiagency_chennai', is_private: false },
    linkedin_url: { value: 'https://linkedin.com/company/lakshmi-agency-chennai', is_private: false },
    footer_text: { value: 'Lakshmi Agency — Industrial Pumps, Electric Motors, Plumbing Goods & Engineering Equipment in Parrys, Chennai since 1985.', is_private: false },
    bank_name: { value: 'State Bank of India', is_private: true },
    bank_account: { value: '38190021948', is_private: true },
    bank_ifsc: { value: 'SBIN0000800', is_private: true },
    bank_branch: { value: 'Parrys Corner Main Branch, Chennai', is_private: true },
    upi_id: { value: 'lakshmiagency@sbi', is_private: true },
    logo_url: { value: '', is_private: false }
  };

  const initialContent = [
    { page_key: 'home', title: 'Industrial Pumps, Electric Motors & Plumbing in Chennai', body: 'Lakshmi Agency supplies genuine industrial, agricultural and domestic pumps, motors and accessories from leading brands.', meta_title: 'Lakshmi Agency Chennai | Industrial Motors & Pumps', meta_description: 'Authorized stockists of CRI, Crompton, Kirloskar, Texmo pumps and electric motors in Parrys, Chennai.' },
    { page_key: 'about', title: 'Over 40 Years of Industrial Sourcing in Chennai', body: 'Located in the heart of Parrys, Chennai, Lakshmi Agency has been the preferred destination for commercial builders, contractors, and industries.', meta_title: 'About Us | Lakshmi Agency Chennai', meta_description: 'Discover the story, values, and engineering legacy of Lakshmi Agency.' },
    { page_key: 'services', title: 'Product Supply, Technical Sourcing & Quotations', body: 'We offer full technical guidance, prompt quotations, direct manufacturer warranty assistance and on-time delivery across Tamil Nadu.', meta_title: 'Services | Lakshmi Agency Chennai', meta_description: 'Industrial supply, technical sizing and delivery services in Chennai.' },
    { page_key: 'contact', title: 'Contact Lakshmi Agency Parrys Chennai', body: 'Visit our showroom on Angappa Naicken Street, Parrys or reach out via WhatsApp or phone.', meta_title: 'Contact Us | Lakshmi Agency Parrys', meta_description: 'Contact Lakshmi Agency for pricing, stock availability, and quotations.' }
  ];

  // ZERO FAKE ACTIVITY LOGS - Starts clean!
  const initialActivity = [];

  return {
    categories,
    subcategories,
    brands: initialBrands,
    products: initialProducts,
    enquiries: initialEnquiries,
    customers: initialCustomers,
    banners: initialBanners,
    team: initialTeam,
    settings: initialSettings,
    content: initialContent,
    activity: initialActivity
  };
}

export function loadLocalStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse local admin store, re-initializing', err);
    const initial = getInitialStore();
    return initial;
  }
}

export function saveLocalStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error('Failed to save local store', err);
  }
}

export function addLocalActivity(action, entity_type, entity_id, details = {}) {
  const store = loadLocalStore();
  const adminName = localStorage.getItem('la_admin_name') || 'Admin';
  const newLog = {
    id: Date.now(),
    admin_name: adminName,
    action,
    entity_type,
    entity_id,
    details: typeof details === 'string' ? details : JSON.stringify(details),
    created_at: new Date().toISOString()
  };
  store.activity = [newLog, ...(store.activity || [])].slice(0, 200);
  saveLocalStore(store);
  return newLog;
}
