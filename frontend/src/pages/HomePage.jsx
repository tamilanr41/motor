import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Cog, Droplets,
  Mail, MapPin, PackageCheck, Phone, ShieldCheck, Wrench, Zap,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { api } from '../services/api.js';
import { categoryImages, editorialImages } from '../utils/content.js';
import { fallbackCatalogue, fallbackProducts } from '../utils/catalogue.js';
import { ContactStrip } from '../components/Site.jsx';

const reveal = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: .65, ease: [.2, .7, .2, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: .08 } } };

const productsServices = [
  { icon: Droplets, title: 'Pumps & pumping systems', text: 'Monobloc, submersible, centrifugal, pressure and sewage pump ranges.', to: '/products?category=pumps' },
  { icon: Cog, title: 'Electric motors', text: 'Motor ranges and customized motor cover enquiries.', to: '/products?category=electric-motors' },
  { icon: Wrench, title: 'Plumbing & hardware', text: 'Everyday plumbing goods and hardware for site and maintenance work.', to: '/products?category=plumbing-hardware' },
  { icon: Zap, title: 'Electrical & sanitary', text: 'Electrical goods, lights, fans and sanitary ware in one place.', to: '/products?category=electrical-goods' },
];

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [banner, setBanner] = useState(null);
  const [settings, setSettings] = useState({});
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroDrift = useTransform(scrollYProgress, [0, 1], [0, 70]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/categories'), api.get('/brands'),
      api.get('/products', { params: { featured: 1, limit: 4 } }),
      api.get('/banners'), api.get('/settings/public'),
    ]).then(([c, b, p, bn, s]) => {
      setCategories(c.status === 'fulfilled' ? c.value.data : fallbackCatalogue.categories);
      setBrands(b.status === 'fulfilled' ? b.value.data : fallbackCatalogue.brands);
      setProducts(p.status === 'fulfilled' ? p.value.data.items : fallbackProducts({ featured: '1', limit: 4 }).items);
      setBanner(bn.status === 'fulfilled' ? (bn.value.data[0] || null) : (fallbackCatalogue.banners?.[0] || null));
      if (s.status === 'fulfilled') setSettings(s.value.data);
      else if (fallbackCatalogue.settings) setSettings(fallbackCatalogue.settings);
    });
  }, []);

  const totalProducts = categories.reduce((sum, c) => sum + Number(c.product_count || 0), 0) || fallbackCatalogue.products.length;
  const totalBrands = brands.length || fallbackCatalogue.brands.length;
  const featuredCategories = (categories.some((c) => Boolean(c.is_featured)) ? categories.filter((c) => Boolean(c.is_featured)) : categories).slice(0, 4);
  const brandNames = brands.slice(0, 18).map((b) => b.name);
  const heroImage = banner?.image_url || editorialImages.hero;
  const rawPhones = typeof settings.phones === 'string' ? settings.phones : '80127 72734, 97872 12722, 044-45522370';
  const phone = rawPhones.split(',')[0].trim();
  const email = settings.email || 'chennailakshmiagency@gmail.com';

  return <>
    {/* Hero */}
    <section className="fab-hero" ref={heroRef} style={{ position: 'relative' }}>
      <motion.div className="fab-hero__bg" style={{ y: heroDrift, backgroundImage: `url("${heroImage}")` }} />
      <div className="fab-hero__overlay" />
      <div className="fab-hero__grid" />
      <div className="wrap fab-hero__inner">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.span className="fab-kicker" variants={reveal}>INDUSTRIAL SUPPLIES <i /> PARRYS · CHENNAI</motion.span>
          <motion.h1 variants={reveal}>{banner?.title || <>Find the right product.<br /><em>Keep work moving.</em></>}</motion.h1>
          <motion.p variants={reveal}>{banner?.subtitle || 'Pumps, electric motors, plumbing, electrical and sanitary essentials — sourced for domestic, commercial and industrial requirements.'}</motion.p>
          <motion.div className="fab-hero__actions" variants={reveal}>
            <Link className="fab-btn" to={banner?.cta_url || '/products'}>{banner?.cta_label || 'Explore the catalogue'} <ArrowUpRight size={17} /></Link>
            <Link className="fab-btn fab-btn--ghost" to="/quote">Request a quote <ArrowRight size={16} /></Link>
          </motion.div>
        </motion.div>
      </div>
      <div className="fab-hero__side"><span>LA / CHENNAI</span><b>Ready for<br />the next job.</b><i>01 — 13</i></div>
      <div className="wrap fab-hero__bottom"><span>LAKSHMI AGENCY · PARRYS</span><span>PRODUCTS / SOURCING / SUPPORT</span><a href="#about">Scroll to explore <ArrowDownRight size={15} /></a></div>
    </section>

    {/* Quick intro */}
    <section className="fab-intro">
      <div className="wrap fab-intro__grid">
        <div><span className="fab-label">ABOUT US</span><h2>We work with any type of <em>industrial product.</em></h2></div>
        <p>From a single replacement part to a wider project list, our team helps you narrow down options, check specifications and confirm availability.</p>
      </div>
      <div className="wrap fab-intro__quick">
        <div><span>01 / PRODUCT RANGE</span><b>{String(categories.length || fallbackCatalogue.categories.length).padStart(2, '0')} families</b></div>
        <div><span>02 / LISTED ENTRIES</span><b>{totalProducts}+ ranges</b></div>
        <div><span>03 / BRAND OPTIONS</span><b>{totalBrands}+ references</b></div>
        <Link to="/products">Open the catalogue <ArrowUpRight size={16} /></Link>
      </div>
    </section>

    {/* About */}
    <section className="fab-section fab-about" id="about">
      <div className="wrap fab-about__grid">
        <motion.div className="fab-about__visual" initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7 }}>
          <img loading="lazy" src={editorialImages.about} alt="Industrial equipment and workshop" />
          <span className="fab-image-wash" />
          <div className="fab-about__badge"><span>ESTABLISHED IN PARRYS</span><b>Chennai,<br />Tamil Nadu</b></div>
          <span className="fab-about__note">13°05' N · 80°17' E</span>
        </motion.div>
        <motion.div className="fab-about__copy" initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={stagger}>
          <motion.span className="fab-label" variants={reveal}>ABOUT LAKSHMI AGENCY</motion.span>
          <motion.h2 variants={reveal}>Next-generation<br /><em>industrial supply.</em></motion.h2>
          <motion.p variants={reveal}>Lakshmi Agency brings pumps, electric motors, plumbing and hardware, sanitary ware, electrical goods, tools and related equipment together for customers in and around Chennai.</motion.p>
          <motion.div className="fab-about__points" variants={reveal}>
            <div><span>01</span><div><b>Wide product range</b><p>Multiple product families for project, maintenance and day-to-day requirements.</p></div></div>
            <div><span>02</span><div><b>Enquiry-led support</b><p>Share the capacity, phase, brand preference and quantity you know; our team checks the options.</p></div></div>
          </motion.div>
          <motion.div variants={reveal}><Link className="fab-text-link" to="/about">More about us <ArrowRight size={16} /></Link></motion.div>
        </motion.div>
      </div>
    </section>

    {/* Brand strip */}
    <section className="fab-clients">
      <div className="wrap fab-clients__top"><span className="fab-label">BRAND REFERENCES</span><p>The catalogue lists options across a wide mix of established manufacturers.</p><Link className="fab-text-link" to="/brands">Brand directory <ArrowUpRight size={15} /></Link></div>
      <div className="fab-marquee"><div className="fab-marquee__track">{[brandNames, brandNames].flat().map((name, i) => <span key={`${name}-${i}`}>{name}<i>✳</i></span>)}</div></div>
    </section>

    {/* Services */}
    <section className="fab-section fab-services">
      <div className="wrap">
        <div className="fab-section-head">
          <div><span className="fab-label">CORPORATE SERVICE</span><h2>Industrial product supply<br />&amp; <em>enquiry support.</em></h2></div>
          <div><p>Tell us what you need. We use your application details to point you towards the right product family and confirm availability.</p><Link className="fab-text-link" to="/services">All services <ArrowRight size={16} /></Link></div>
        </div>
        <motion.div className="fab-service-grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: .12 }}>
          {productsServices.map(({ icon: Icon, title, text, to }, i) => (
            <motion.div className="fab-service" variants={reveal} key={title} whileHover={{ y: -6 }}>
              <Link to={to}>
                <span className="fab-service__num">0{i + 1}</span>
                <span className="fab-service__icon"><Icon size={27} strokeWidth={1.5} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="fab-service__more">View range <ArrowUpRight size={16} /></span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Portfolio-style product families */}
    <section className="fab-section fab-portfolio">
      <div className="wrap">
        <div className="fab-section-head">
          <div><span className="fab-label">FROM THE CATALOGUE</span><h2>Explore by <em>product family.</em></h2></div>
          <div><p>Each card opens a filtered view of the catalogue. Exact models, specifications and prices are confirmed on enquiry.</p><Link className="fab-text-link" to="/products">View the full catalogue <ArrowUpRight size={16} /></Link></div>
        </div>
        <motion.div className="fab-portfolio__grid" variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: .12 }}>
          {featuredCategories.map((c, i) => (
            <motion.div className="fab-portfolio__card" variants={reveal} key={c.slug}>
              <Link to={`/products?category=${c.slug}`}>
                <img loading="lazy" src={c.image_url || categoryImages[c.slug] || categoryImages.default} alt="" />
                <span className="fab-image-wash" />
                <span className="fab-portfolio__tag">0{i + 1} / {String(c.product_count || 0).padStart(2, '0')} LISTED</span>
                <span className="fab-portfolio__title">{c.name}</span>
                <span className="fab-portfolio__arrow"><ArrowUpRight size={18} /></span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        {products.length > 0 && <p className="fab-portfolio__note">Representative category imagery. Confirm the exact product, specifications and availability with our team.</p>}
      </div>
    </section>

    {/* Dark values section */}
    <section className="fab-values">
      <div className="wrap">
        <div className="fab-values__head"><span className="fab-label fab-label--light">WHY LAKSHMI AGENCY</span><h2>A dependable partner for <em>every enquiry.</em></h2></div>
        <div className="fab-values__grid">
          <div className="fab-value"><PackageCheck size={29} strokeWidth={1.4} /><h3>Product know-how</h3><p>Share the application, capacity and brand preference you know. Our team helps review the options in that category.</p><span>01</span></div>
          <div className="fab-value"><ShieldCheck size={29} strokeWidth={1.4} /><h3>Enquiry-led support</h3><p>Model, specification, price and availability are confirmed with our team before you make a decision.</p><span>02</span></div>
          <div className="fab-value"><MapPin size={29} strokeWidth={1.4} /><h3>Local presence</h3><p>Visit our store on Angappa Naicken Street in Parrys, or reach us by phone and email.</p><span>03</span></div>
        </div>
      </div>
    </section>

    {/* Process */}
    <section className="fab-section fab-process">
      <div className="wrap fab-process__grid">
        <div className="fab-process__visual">
          <img loading="lazy" src={editorialImages.process} alt="Industrial work in progress" />
          <span className="fab-image-wash" />
          <div className="fab-process__stamp"><span>SPEC</span><b>→ SOURCE<br />→ SUPPLY</b></div>
        </div>
        <div className="fab-process__copy">
          <span className="fab-label">WORK PROCESS</span>
          <h2>From requirement to <em>the right product.</em></h2>
          <p>We don't guess at the important details. Send what you know and our team will help fill in the gaps.</p>
          <div className="fab-steps">
            {[
              ['01', 'Share the need', 'Application, capacity, brand preference and quantity.'],
              ['02', 'Review options', 'We check the product families and brands listed for your category.'],
              ['03', 'Confirm details', 'Our team follows up on model, price, suitability and availability.'],
            ].map(([n, title, body]) => <div className="fab-step" key={n}><span>{n}</span><div><b>{title}</b><p>{body}</p></div><ArrowUpRight size={18} /></div>)}
          </div>
          <Link className="fab-btn fab-btn--navy" to="/quote">Build an enquiry <ArrowRight size={16} /></Link>
        </div>
      </div>
    </section>

    {/* Brief CTA */}
    <section className="fab-brief">
      <div className="wrap fab-brief__inner">
        <div><span className="fab-label fab-label--light">HAVE A PROJECT?</span><h2>Have a requirement?<br /><em>Send a brief!</em></h2></div>
        <div className="fab-brief__actions">
          <p>Tell us what you are working on. We will help get the right product conversation started.</p>
          <a className="fab-brief__mail" href={`mailto:${email}`}><Mail size={19} /> {email}</a>
          <Link className="fab-btn" to="/contact">Send brief <ArrowUpRight size={17} /></Link>
        </div>
      </div>
    </section>

    {/* Catalogue at a glance */}
    <section className="fab-section fab-stats">
      <div className="wrap">
        <div className="fab-section-head fab-section-head--compact"><div><span className="fab-label">CATALOGUE AT A GLANCE</span><h2>A wide range, <em>one enquiry.</em></h2></div><p>These counts reflect the product families, listed range entries and brand references in our catalogue.</p></div>
        <div className="fab-stats__grid">
          {[
            { n: categories.length || fallbackCatalogue.categories.length, label: 'PRODUCT FAMILIES', width: '100%' },
            { n: totalProducts, label: 'RANGE ENTRIES', width: '88%' },
            { n: totalBrands, label: 'BRAND REFERENCES', width: '76%' },
          ].map((s) => <div className="fab-stat" key={s.label}><b>{s.n}<i>+</i></b><span>{s.label}</span><div className="fab-stat__bar"><i style={{ width: s.width }} /></div></div>)}
        </div>
      </div>
    </section>

    {/* Useful starting points */}
    <section className="fab-section fab-guides">
      <div className="wrap">
        <div className="fab-section-head fab-section-head--compact"><div><span className="fab-label">FROM OUR CATALOGUE</span><h2>Useful starting points.</h2></div><Link className="fab-text-link" to="/products">Search the catalogue <ArrowUpRight size={16} /></Link></div>
        <div className="fab-guides__grid">
          {[
            { slug: 'pumps', name: 'Pumps', img: editorialImages.guidePumps, text: 'Monobloc, submersible, centrifugal and pressure ranges.' },
            { slug: 'electric-motors', name: 'Electric Motors', img: editorialImages.guideMotors, text: 'Motor ranges and custom motor cover enquiries.' },
            { slug: 'plumbing-hardware', name: 'Plumbing & Hardware', img: editorialImages.guidePlumbing, text: 'Plumbing goods and hardware for everyday site work.' },
          ].map((g, i) => <Link className="fab-guide" to={`/products?category=${g.slug}`} key={g.slug}><div className="fab-guide__image"><img loading="lazy" src={g.img} alt="" /><span className="fab-image-wash" /><span className="fab-guide__label">0{i + 1} / CATEGORY</span></div><div className="fab-guide__body"><h3>{g.name}</h3><p>{g.text}</p><span>View products <ArrowRight size={15} /></span></div></Link>)}
        </div>
      </div>
    </section>

    <section className="fab-contact-band">
      <div className="wrap fab-contact-band__inner">
        <div><span className="fab-label fab-label--light">TALK TO OUR TEAM</span><h3>Let's find the right fit for your requirement.</h3></div>
        <div><a href={`tel:${phone.replace(/[^\d+]/g, '')}`}><Phone size={17} /> {phone}</a><Link className="fab-btn" to="/quote">Enquire now <ArrowUpRight size={16} /></Link></div>
      </div>
    </section>
    <ContactStrip />
  </>;
}
