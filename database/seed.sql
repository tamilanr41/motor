SET NAMES utf8mb4;

INSERT IGNORE INTO categories (name,slug,description,display_order) VALUES
('Pumps','pumps','Water, process and industrial pumping solutions.',1),
('Electric Motors','electric-motors','Electric motors, drives and motor accessories.',2),
('Plumbing & Hardware','plumbing-hardware','Pipes, fittings, valves, hoses and site supplies.',3),
('Sanitary Ware','sanitary-ware','Sanitary fittings and bathroom products.',4),
('Home Appliances','home-appliances','Practical appliances for homes and workplaces.',5),
('Fans','fans','Ceiling, exhaust and industrial fans.',6),
('Lights','lights','LED, tube, flood and work lighting.',7),
('Engines','engines','Petrol and diesel engine equipment.',8),
('Electrical Goods','electrical-goods','Electrical accessories, controls and panels.',9),
('Gear Boxes','gear-boxes','Gear boxes and transmission equipment.',10),
('Power Tools','power-tools','Tools and equipment for trade and industry.',11),
('Generators','generators','Petrol and diesel generator sets.',12),
('Air Compressors','air-compressors','Air compression equipment and accessories.',13);
UPDATE categories SET is_featured=1 WHERE slug IN ('pumps','electric-motors','plumbing-hardware','sanitary-ware','electrical-goods','fans','lights','generators');

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id, s.name, s.slug, s.ord FROM categories c JOIN (
  SELECT 'Mini Pump – Self Priming Monobloc' name,'mini-pump-self-priming-monobloc' slug,1 ord UNION ALL
  SELECT 'Centrifugal Pump','centrifugal-pump',2 UNION ALL SELECT 'Shallow Well Pump','shallow-well-pump',3 UNION ALL
  SELECT 'V Type Monobloc Pump','v-type-monobloc-pump',4 UNION ALL SELECT 'Slow Speed Monobloc Pump','slow-speed-monobloc-pump',5 UNION ALL
  SELECT 'Open Well Submersible Pump','open-well-submersible-pump',6 UNION ALL SELECT 'Centrifugal Jet Pump','centrifugal-jet-pump',7 UNION ALL
  SELECT 'Borewell Compressor Pump','borewell-compressor-pump',8 UNION ALL SELECT 'Mono Compressor Pump','mono-compressor-pump',9 UNION ALL
  SELECT 'Belt Compressor Pump','belt-compressor-pump',10 UNION ALL SELECT 'Borewell Submersible Pump','borewell-submersible-pump',11 UNION ALL
  SELECT 'Pressure Booster Pump','pressure-booster-pump',12 UNION ALL SELECT 'Car Wash Pump','car-wash-pump',13 UNION ALL
  SELECT 'Centrifugal SS Monobloc Pump','centrifugal-ss-monobloc-pump',14 UNION ALL SELECT 'Vertical Multistage Pump','vertical-multistage-pump',15 UNION ALL
  SELECT 'Vertical Openwell Submersible Pump','vertical-openwell-submersible-pump',16 UNION ALL SELECT 'Vacuum Pump','vacuum-pump',17 UNION ALL
  SELECT 'High Head High Discharge Pump','high-head-high-discharge-pump',18 UNION ALL SELECT 'Coolant Pump','coolant-pump',19 UNION ALL
  SELECT 'Chemical Pump','chemical-pump',20 UNION ALL SELECT 'Sewage Pump','sewage-pump',21 UNION ALL
  SELECT 'Sewage Cutter Submersible Pump','sewage-cutter-submersible-pump',22 UNION ALL SELECT 'Super Suction Pump','super-suction-pump',23 UNION ALL
  SELECT 'STP/ETP Pump','stp-etp-pump',24 UNION ALL SELECT 'Swimming Pool Pump','swimming-pool-pump',25 UNION ALL
  SELECT 'Gear Pump','gear-pump',26 UNION ALL SELECT 'Stage Pump','stage-pump',27 UNION ALL SELECT 'Bare Pump','bare-pump',28 UNION ALL
  SELECT 'Fish Tank Pump','fish-tank-pump',29 UNION ALL SELECT 'Twin Booster Pump','twin-booster-pump',30 UNION ALL
  SELECT 'Bentonite Pump','bentonite-pump',31 UNION ALL SELECT 'Engine Pump Set','engine-pump-set',32
) s ON c.slug='pumps';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Squirrel Cage Induction Motor' name,'squirrel-cage-induction-motor' slug,1 ord UNION ALL
  SELECT 'TEFC Motor','tefc-motor',2 UNION ALL SELECT 'FLP Motor','flp-motor',3 UNION ALL
  SELECT 'Brake Motor','brake-motor',4 UNION ALL SELECT 'Crane Duty Motor','crane-duty-motor',5 UNION ALL
  SELECT 'Textile Motor','textile-motor',6 UNION ALL SELECT 'Chiller Motor','chiller-motor',7 UNION ALL
  SELECT 'DC Motor','dc-motor',8 UNION ALL SELECT 'Gear Box','motor-gear-box',9 UNION ALL
  SELECT 'VFD','vfd',10 UNION ALL SELECT 'Customized Motor Covers','customized-motor-covers',11
) s ON c.slug='electric-motors';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'PVC Pipes' name,'pvc-pipes' slug,1 ord UNION ALL SELECT 'PVC Fittings','pvc-fittings',2 UNION ALL
  SELECT 'UPVC Pipes','upvc-pipes',3 UNION ALL SELECT 'UPVC Fittings','upvc-fittings',4 UNION ALL
  SELECT 'CPVC Pipes','cpvc-pipes',5 UNION ALL SELECT 'CPVC Fittings','cpvc-fittings',6 UNION ALL
  SELECT 'HDPE Pipes','hdpe-pipes',7 UNION ALL SELECT 'Suction Hose','suction-hose',8 UNION ALL
  SELECT 'Delivery Hose','delivery-hose',9 UNION ALL SELECT 'Canvas Hose','canvas-hose',10 UNION ALL
  SELECT 'Bore Clamp','bore-clamp',11 UNION ALL SELECT 'Bore Cover','bore-cover',12 UNION ALL
  SELECT 'Rope','rope',13 UNION ALL SELECT 'Manhole Cover','manhole-cover',14 UNION ALL
  SELECT 'Jet Angle','jet-angle',15 UNION ALL SELECT 'Adopter','adopter',16 UNION ALL
  SELECT 'Motor Cover','motor-cover',17 UNION ALL SELECT 'Butterfly Valve','butterfly-valve',18 UNION ALL
  SELECT 'Safety Items','safety-items',19 UNION ALL SELECT 'Water Meter','water-meter',20 UNION ALL
  SELECT 'Water Storage Tanks','water-storage-tanks',21
) s ON c.slug='plumbing-hardware';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Western Toilet' name,'western-toilet' slug,1 ord UNION ALL SELECT 'Indian Toilet','indian-toilet',2 UNION ALL
  SELECT 'Kitchen Sink','kitchen-sink',3 UNION ALL SELECT 'Lab Sink','lab-sink',4 UNION ALL
  SELECT 'Wall Mixer','wall-mixer',5 UNION ALL SELECT 'Urinal','urinal',6 UNION ALL
  SELECT 'Wash Basin','wash-basin',7 UNION ALL SELECT 'Short Body Tap','short-body-tap',8 UNION ALL
  SELECT 'Long Body Tap','long-body-tap',9 UNION ALL SELECT 'Pillar Cock','pillar-cock',10 UNION ALL
  SELECT 'Angle Cock','angle-cock',11 UNION ALL SELECT 'Health Faucet','health-faucet',12 UNION ALL
  SELECT 'Pressure Tank','pressure-tank',13 UNION ALL SELECT 'Pressure Switch','pressure-switch',14 UNION ALL
  SELECT 'Water Heater','sanitary-water-heater',15
) s ON c.slug='sanitary-ware';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Tube Light' name,'tube-light' slug,1 ord UNION ALL SELECT 'LED Light','led-light',2 UNION ALL
  SELECT 'Focus / Flood Light','focus-flood-light',3
) s ON c.slug='lights';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Wires' name,'electrical-wires' slug,1 ord UNION ALL SELECT 'Switches','electrical-switches',2 UNION ALL
  SELECT 'Sockets','electrical-sockets',3 UNION ALL SELECT 'MCB','mcb',4 UNION ALL
  SELECT 'Panel Boards','panel-boards',5 UNION ALL SELECT 'Water Level Controller','water-level-controller',6 UNION ALL
  SELECT 'Starter','motor-starter',7 UNION ALL SELECT 'Stabilizer','stabilizer',8 UNION ALL
  SELECT 'Electrical Safety Items','electrical-safety-items',9
) s ON c.slug='electrical-goods';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Drilling Machine' name,'drilling-machine' slug,1 ord UNION ALL SELECT 'Welding Machine','welding-machine',2 UNION ALL
  SELECT 'Cutting Machine','cutting-machine',3 UNION ALL SELECT 'Tree Cutting Machine','tree-cutting-machine',4 UNION ALL
  SELECT 'Concrete Vibrator','concrete-vibrator',5 UNION ALL SELECT 'Floor Trowel','floor-trowel',6 UNION ALL
  SELECT 'Brush Cutter','brush-cutter',7 UNION ALL SELECT 'Earth Rammer','earth-rammer',8 UNION ALL
  SELECT 'Grinding Machine','grinding-machine',9 UNION ALL SELECT 'Vibrator Machine','vibrator-machine',10 UNION ALL
  SELECT 'Mini Lift','mini-lift',11 UNION ALL SELECT 'Bench Grinders','bench-grinders',12 UNION ALL
  SELECT 'Buffer Polishers','buffer-polishers',13 UNION ALL SELECT 'Dental Lathes','dental-lathes',14
) s ON c.slug='power-tools';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Petrol Engine' name,'petrol-engine' slug,1 ord UNION ALL SELECT 'Diesel Engine','diesel-engine',2
) s ON c.slug='engines';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Petrol Generator' name,'petrol-generator' slug,1 ord UNION ALL SELECT 'Diesel Generator','diesel-generator',2
) s ON c.slug='generators';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Air Compressors' name,'compressor-equipment' slug,1 ord
) s ON c.slug='air-compressors';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Gear Boxes' name,'industrial-gear-boxes' slug,1 ord
) s ON c.slug='gear-boxes';

INSERT IGNORE INTO subcategories (category_id,name,slug,display_order)
SELECT c.id,s.name,s.slug,s.ord FROM categories c JOIN (
  SELECT 'Fans' name,'fan-products' slug,1 ord
) s ON c.slug='fans';

INSERT IGNORE INTO brands (name,slug) VALUES
('SENBA','senba'),('BESTEN','besten'),('CRI','cri'),('CROMPTON','crompton'),('KIRLOSKAR','kirloskar'),('SUGUNA','suguna'),('TEXMO','texmo'),('AQUATEX','aquatex'),('TARRO','tarro'),('SAMUDRA','samudra'),('V-GUARD','v-guard'),('RAMESH','ramesh'),('BEST','best'),('LAKSHMI','lakshmi'),('WILO','wilo'),('KSB','ksb'),('GRUNDFOS','grundfos'),('LUBI','lubi'),('BTALI','btali'),('CNP','cnp'),('TULLU','tullu'),('ALGO','algo'),('FALCON','falcon'),
('ABB','abb'),('BHARAT BIJLEE','bharat-bijlee'),('SIEMENS','siemens'),('LHP','lhp'),('HAVELLS','havells'),
('FINOLEX','finolex'),('ASHIRVAD','ashirvad'),('ASTRAL','astral'),('SUPREME','supreme'),('STAR','star'),('PRINCE','prince'),
('PARRYWARE','parryware'),('HINDWARE','hindware'),('JAQUAR','jaquar'),('KOHLER','kohler'),('METRO','metro'),('WATERMAN','waterman'),
('ORBIT','orbit'),('L&T','l-and-t'),('LEGRAND','legrand'),('GM','gm'),('HIFI','hifi'),('HELLO','hello'),('PHILIPS','philips'),
('HONDA','honda'),('BOSCH','bosch'),('STANLEY','stanley'),('INGCO','ingco'),('DEWALT','dewalt'),('HIKOKI','hikoki'),('MAKITA','makita'),('RALLI WOLF','ralli-wolf');

INSERT IGNORE INTO category_brands (category_id,brand_id)
SELECT c.id,b.id FROM categories c JOIN brands b ON
 (c.slug='pumps' AND b.slug IN ('senba','besten','cri','crompton','kirloskar','suguna','texmo','aquatex','tarro','samudra','v-guard','ramesh','best','lakshmi','wilo','ksb','grundfos','lubi','btali','cnp','tullu','algo','falcon')) OR
 (c.slug='electric-motors' AND b.slug IN ('abb','bharat-bijlee','crompton','kirloskar','siemens','lakshmi','suguna','lhp','havells')) OR
 (c.slug='plumbing-hardware' AND b.slug IN ('finolex','ashirvad','astral','supreme','star','prince')) OR
 (c.slug='sanitary-ware' AND b.slug IN ('parryware','hindware','jaquar','kohler','metro','waterman')) OR
 (c.slug='electrical-goods' AND b.slug IN ('orbit','l-and-t','siemens','legrand','gm','hifi','hello','finolex','havells','philips')) OR
 (c.slug='generators' AND b.slug IN ('honda','kirloskar','senba')) OR
 (c.slug='power-tools' AND b.slug IN ('bosch','stanley','ingco','dewalt','hikoki','makita','ralli-wolf'));

INSERT IGNORE INTO website_settings (setting_key,setting_value) VALUES
('business_name','LAKSHMI AGENCY'),('address','Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.'),
('email','chennailakshmiagency@gmail.com'),('phones','80127 72734, 97872 12722, 044-45522370'),('gst_number','33CYHPS0640F1ZM'),
('whatsapp_number',''),('google_maps_query','Angappa Naicken Street, Parrys, Chennai 600001'),('footer_text','Industrial products and engineering supplies for domestic, commercial and industrial requirements.'),
('instagram_url',''),('facebook_url',''),('linkedin_url','');

INSERT IGNORE INTO page_contents (page_key,title,body,meta_title,meta_description) VALUES
('home','Your Trusted Partner in Pumps, Motors & Industrial Solutions','Delivering dependable products for domestic, commercial and industrial requirements.','Industrial Pumps & Motors in Chennai | Lakshmi Agency','Explore pumps, motors, plumbing and industrial supplies from Lakshmi Agency in Parrys, Chennai.'),
('about','Built around dependable supply','Lakshmi Agency supplies industrial and domestic products across pumps, electric motors, plumbing, electrical goods, sanitary ware and related equipment. We help customers identify suitable products for their requirements and coordinate quotation and availability enquiries with care.','About Lakshmi Agency | Chennai Industrial Supplier','Learn about Lakshmi Agency, a supplier of pumps, motors and engineering products in Parrys, Chennai.'),
('services','Product supply for everyday and industrial needs','Water pump, diesel pump, oil and grease pump, sewage pump, RO pump, pressure pump, air compressor, electric motor, customized motor cover, water flow meter, engine, generator, plumbing goods, electrical goods, controller, panel board, sanitary fittings and water heater enquiries.','Services | Lakshmi Agency Chennai','Product supply and quotation enquiries for industrial and domestic requirements.'),
('contact','Contact Lakshmi Agency','Visit or contact our team in Parrys, Chennai for product availability, technical information and quotations.','Contact Lakshmi Agency | Parrys Chennai','Contact Lakshmi Agency for product and bulk purchase enquiries in Chennai.');

-- No product rows are seeded: production catalogue records must come from the supplied workbook or verified admin entry.
