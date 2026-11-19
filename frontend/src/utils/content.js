import { assetURL } from '../services/api.js';

const unsplash = (id, width = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85`;

/* Every category has its own photograph — no repeated imagery across cards. */
export const categoryImages = {
  pumps: unsplash('1581092160562-40aa08e78837'),
  'electric-motors': unsplash('1567789884554-0b844b597180'),
  'plumbing-hardware': unsplash('1621905251189-08b45d6a269e'),
  'sanitary-ware': unsplash('1584622650111-993a426fbf0a'),
  'home-appliances': unsplash('1556911220-e15b29be8c8f'),
  fans: unsplash('1590725140246-20acdee442be'),
  lights: unsplash('1540932239986-30128078f3c5'),
  engines: unsplash('1586864387967-d02ef85d93e8'),
  'electrical-goods': unsplash('1518770660439-4636190af475'),
  'gear-boxes': unsplash('1581092918056-0c4c3acd3789'),
  'power-tools': unsplash('1504148455328-c376907d081c'),
  generators: unsplash('1581093450021-4a7360e9a6b5'),
  'air-compressors': unsplash('1581091226825-a6a2a5aee158'),
  default: unsplash('1565043589221-1a6fd9ae45c7'),
};

/* Editorial imagery used by the homepage and account/admin screens. */
export const editorialImages = {
  hero: unsplash('1504917595217-d4dc5ebe6122', 2000),
  about: unsplash('1565008447742-97f6f38c985c', 1200),
  process: unsplash('1513828583688-c52646db42da', 1100),
  brief: unsplash('1504307651254-35680f356dfd', 1400),
  guidePumps: unsplash('1621905252507-b35492cc74b4'),
  guideMotors: unsplash('1530124566582-a618bc2615dc'),
  guidePlumbing: unsplash('1581094794329-c8112a89af12'),
  login: unsplash('1487958449943-2429e8be8625', 1400),
  dashboard: unsplash('1552321554-5fefe8c9ef14', 1400),
  account: unsplash('1541888946425-d81bb19240f5', 1500),
  welcome: unsplash('1532094349884-543bc11b234d', 1200),
};

export const services = [
  'Water Pump Supply', 'Diesel Pump Supply', 'Oil and Grease Pumps', 'Sewage Pumps', 'RO Pumps', 'Pressure Pumps',
  'Air Compressors', 'Electric Motors', 'Customized Motor Covers', 'Water Flow Meters', 'Diesel and Petrol Engines',
  'Generators', 'Plumbing Goods', 'Electrical Goods', 'Water Level Controllers', 'Panel Boards', 'Sanitary Fittings', 'Water Heaters',
];

/* Verified photographs used to give every brand, service and product a distinct image. */
const photoPool = [
  '1581092160562-40aa08e78837', '1567789884554-0b844b597180', '1621905251189-08b45d6a269e',
  '1584622650111-993a426fbf0a', '1556911220-e15b29be8c8f', '1590725140246-20acdee442be',
  '1540932239986-30128078f3c5', '1586864387967-d02ef85d93e8', '1518770660439-4636190af475',
  '1581092918056-0c4c3acd3789', '1504148455328-c376907d081c', '1581093450021-4a7360e9a6b5',
  '1581091226825-a6a2a5aee158', '1565043589221-1a6fd9ae45c7', '1504917595217-d4dc5ebe6122',
  '1565008447742-97f6f38c985c', '1513828583688-c52646db42da', '1504307651254-35680f356dfd',
  '1621905252507-b35492cc74b4', '1530124566582-a618bc2615dc', '1581094794329-c8112a89af12',
  '1487958449943-2429e8be8625', '1552321554-5fefe8c9ef14', '1541888946425-d81bb19240f5',
  '1532094349884-543bc11b234d', '1581092334651-ddf26d9a09d0', '1621905251918-48416bd8575a',
  '1620626011761-996317b8d101', '1507473885765-e6ed057f782c', '1581092580497-e0d23cbdf1dc',
  '1581092160607-ee22621dd758', '1497366754035-f200968a6e72',
];

const hashValue = (value) => String(value || '').split('').reduce((total, char) => ((total * 31) + char.charCodeAt(0)) >>> 0, 7);

export const brandImageFor = (brand, width = 620) => unsplash(photoPool[hashValue(brand?.slug || brand?.name) % photoPool.length], width);
export const serviceImageFor = (name, width = 760) => unsplash(photoPool[hashValue(name) % photoPool.length], width);
export const productImageFor = (product, width = 900) => {
  if (product?.image_url) return assetURL(product.image_url);
  const key = `${product?.slug || product?.id || ''}-${product?.subcategory_slug || product?.category_slug || ''}`;
  return unsplash(photoPool[hashValue(key) % photoPool.length], width);
};

export const brandPalette = [
  { tint: '#fff1ed', accent: '#fa4729' },
  { tint: '#eef1ff', accent: '#181d4e' },
  { tint: '#fff6e8', accent: '#b5651d' },
  { tint: '#eaf6f2', accent: '#17705c' },
];

export const waLink = (number, message) => {
  const clean = String(number || '').replace(/\D/g, '');
  return clean ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}` : '#';
};

export function productMessage(product = {}) {
  return `Hello Lakshmi Agency,\n\nI would like to enquire about:\n\nProduct: ${product.name || ''}\nBrand: ${product.brands || product.brand || ''}\nSpecification: ${product.hp_rating || product.specification || ''}\nQuantity: \n\nPlease share the quotation and availability details.`;
}
