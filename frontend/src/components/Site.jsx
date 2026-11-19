import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, Phone, MessageCircle, X, MapPin, Mail, ArrowRight, Droplets, Facebook, Instagram, Linkedin, UserRound } from 'lucide-react';
import { api } from '../services/api.js';
import { productImageFor, productMessage, waLink } from '../utils/content.js';
import { SiteLogo } from './SiteLogo.jsx';
import { motion, useScroll, useSpring } from 'framer-motion';

const nav=[['Products','/products'],['Brands','/brands'],['Services','/services'],['About','/about'],['Contact','/contact']];
export function Header(){
  const [open,setOpen]=useState(false),[settings,setSettings]=useState({}),[scrolled,setScrolled]=useState(false);const loc=useLocation();
  useEffect(()=>{setOpen(false);api.get('/settings/public').then(r=>setSettings(r.data)).catch(()=>{});},[loc.pathname]);
  useEffect(()=>{const onScroll=()=>setScrolled(window.scrollY>10);onScroll();window.addEventListener('scroll',onScroll,{passive:true});return()=>window.removeEventListener('scroll',onScroll);},[]);
  const primaryPhone=(settings.phones||'80127 72734, 97872 12722, 044-45522370').split(',')[0].trim();
  const accountUrl=localStorage.getItem('la_customer_token')?'/account/dashboard':'/account/login';
  const headerClass=`site-header${loc.pathname==='/'?' home':''}${loc.pathname==='/'&&!scrolled?' transparent':''}${scrolled?' scrolled':''}`;
  return <header className={headerClass}><div className="topline"><div className="wrap topline-inner"><span>Industrial supplies for domestic, commercial & industrial needs</span><div><a href={`tel:${primaryPhone.replace(/[^\d+]/g,'')}`}><Phone size={13}/> {primaryPhone}</a><Link to="/contact">Visit our Parrys store <ArrowUpRight size={13}/></Link></div></div></div>
    <div className="wrap nav-row"><Link to="/" className="brand-lockup"><span className="brand-logo"><SiteLogo className="site-logo"/></span><span><b>{settings.business_name||'LAKSHMI AGENCY'}</b><small>INDUSTRIAL PRODUCTS & SUPPLIES</small></span></Link>
    <nav className={open?'main-nav open':'main-nav'}>{nav.map(([label,url])=><NavLink end={url==='/'} key={url} to={url}>{label}</NavLink>)}<Link className="nav-account" to={accountUrl}><UserRound size={15}/>{localStorage.getItem('la_customer_token')?'My account':'Sign in'}</Link><Link className="nav-quote" to="/quote">Request a quote <ArrowUpRight size={15}/></Link></nav>
    <div className="nav-mobile-actions"><Link to="/quote" className="mobile-quote">Quote</Link><button aria-label="Toggle menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div></header>
}

export function Footer(){
  const [s,setS]=useState({});useEffect(()=>{api.get('/settings/public').then(r=>setS(r.data)).catch(()=>{});},[]);
  const phones=(s.phones||'80127 72734, 97872 12722, 044-45522370').split(',').map(x=>x.trim());
  const socials=[['facebook_url',Facebook],['instagram_url',Instagram],['linkedin_url',Linkedin]].filter(([key])=>s[key]);
  return <footer className="footer"><div className="wrap footer-grid"><div className="footer-about"><Link to="/" className="brand-lockup footer-brand"><span className="brand-logo"><SiteLogo className="site-logo"/></span><span><b>{s.business_name||'LAKSHMI AGENCY'}</b><small>INDUSTRIAL PRODUCTS & SUPPLIES</small></span></Link><p>{s.footer_text||'Dependable products for domestic, commercial and industrial requirements. Speak with our team for product information and quotations.'}</p><Link className="footer-link" to="/about">More about us <ArrowRight size={15}/></Link>{socials.length>0&&<div className="social-links">{socials.map(([key,Icon])=><a key={key} href={s[key]} target="_blank" rel="noreferrer" aria-label={key.replace('_url','')}><Icon size={16}/></a>)}</div>}</div>
    <div><h4>Explore</h4><Link to="/products">Product catalogue</Link><Link to="/brands">Brands</Link><Link to="/services">Services</Link><Link to="/quote">Request a quote</Link><Link to="/account/login">Customer account</Link></div>
    <div><h4>Contact</h4><p><MapPin size={15}/>{s.address||'Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.'}</p><a href={`mailto:${s.email||'chennailakshmiagency@gmail.com'}`}><Mail size={15}/>{s.email||'chennailakshmiagency@gmail.com'}</a>{phones.map((p,i)=><a key={i} href={`tel:${p.replace(/[^\d+]/g,'')}`}><Phone size={15}/>{p}</a>)}</div>
    <div className="footer-cta"><span className="eyebrow">NEED PRODUCT SUPPORT?</span><h3>Let's find the right fit for your requirement.</h3><Link to="/quote" className="button button-light">Talk to our team <ArrowUpRight size={16}/></Link></div></div>
    <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} Lakshmi Agency. All rights reserved.</span><span>GST: {s.gst_number||'33CYHPS0640F1ZM'}</span></div></footer>
}

export function FloatingWhatsApp({product}){
  const [settings,setSettings]=useState({});useEffect(()=>{api.get('/settings/public').then(r=>setSettings(r.data)).catch(()=>{});},[]);
  const configured=Boolean(settings.whatsapp_number),url=configured?waLink(settings.whatsapp_number,product?productMessage(product):'Hello Lakshmi Agency, I would like to enquire about your products and services.'):'/quote';
  return <a className="whatsapp-float" href={url} target={configured?'_blank':undefined} rel={configured?'noreferrer':undefined} aria-label={configured?'WhatsApp enquiry':'Send an enquiry'}><MessageCircle size={20}/><span>{configured?'WhatsApp':'Enquire now'}</span></a>;
}

export function PageTitle({eyebrow,title,body,crumb}){return <div className="page-title"><div className="wrap"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><span>{crumb||title}</span></div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{body&&<p>{body}</p>}</div></div>}

export function ContactStrip(){const [s,setS]=useState({});useEffect(()=>{api.get('/settings/public').then(r=>setS(r.data)).catch(()=>{});},[]);const phone=(s.phones||'80127 72734, 97872 12722, 044-45522370').split(',')[0].trim();return <div className="contact-strip"><div className="wrap strip-inner"><div><span className="strip-icon"><Phone size={18}/></span><span><small>Call our team</small><b>{phone}</b></span></div><div><span className="strip-icon"><MapPin size={18}/></span><span><small>Find our store</small><b>Parrys, Chennai</b></span></div><Link to="/quote" className="button button-dark">Send an enquiry <ArrowRight size={16}/></Link></div></div>}

export function EmptyCatalog(){return <div className="empty-catalog"><div className="empty-icon"><Droplets/></div><h3>Catalogue details are being updated</h3><p>Our team can help confirm products, brands and specifications. Send us your requirement for availability and a quotation.</p><Link to="/quote" className="button button-dark">Ask our team <ArrowRight size={16}/></Link></div>}

export function ProductCard({product}){
  const image=productImageFor(product);
  const brandList=product.brand_list||String(product.brands||'').split(',').map(x=>x.trim()).filter(Boolean);
  const brandLabel=brandList.length>4?`${brandList.slice(0,3).join(', ')} +${brandList.length-3}`:brandList.join(', ');
  return <motion.article className="product-card" initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.2}} transition={{duration:.5}} whileHover={{y:-7,rotateX:1.2}} style={{transformPerspective:900}}><Link to={`/products/${product.slug}`} className="product-image"><motion.img loading="lazy" src={image} alt={`${product.category_name||'Industrial'} range image for ${product.name}`} whileHover={{scale:1.08}} transition={{duration:.65,ease:'easeOut'}}/><span className="product-image-note">RANGE IMAGE</span><span className="image-arrow"><ArrowUpRight size={17}/></span></Link><div className="product-info"><span className="product-category">{product.category_name||'Industrial product'}</span><h3><Link to={`/products/${product.slug}`}>{product.name}</Link></h3><div className="product-meta">{brandLabel&&<span title={brandList.join(', ')}>{brandLabel}</span>}{product.hp_rating&&<span>{product.hp_rating}</span>}{product.phase&&<span>{product.phase}</span>}</div><div className="product-actions"><Link to={`/products/${product.slug}`}>View details <ArrowRight size={14}/></Link><Link to={`/quote?product=${encodeURIComponent(product.name)}`}>Enquire</Link></div></div></motion.article>
}

function ScrollProgress(){const {scrollYProgress}=useScroll();const scaleX=useSpring(scrollYProgress,{stiffness:90,damping:28,restDelta:.001});return <motion.div aria-hidden="true" className="scroll-progress" style={{scaleX,transformOrigin:'0%'}}/>}
export function Layout({children}){return <><ScrollProgress/><Header/><main>{children}</main><Footer/><FloatingWhatsApp/></>}
