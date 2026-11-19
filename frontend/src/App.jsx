import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Layout, PageTitle } from './components/Site.jsx';
import { api } from './services/api.js';
const Admin=lazy(()=>import('./admin/Admin.jsx'));
const CustomerAccount=lazy(()=>import('./customer/CustomerAccount.jsx'));
const Home=lazy(()=>import('./pages/HomePage.jsx'));
const Products=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.Products})));
const ProductDetail=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.ProductDetail})));
const Brands=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.Brands})));
const BrandDetail=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.BrandDetail})));
const About=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.About})));
const Services=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.Services})));
const Contact=lazy(()=>import('./pages/ContactPage.jsx'));
const Quote=lazy(()=>import('./pages/PublicPages.jsx').then(m=>({default:m.Quote})));

function Seo({title,description,path}){
  useEffect(()=>{
    document.title=title;
    let desc=document.querySelector('meta[name="description"]');if(!desc){desc=document.createElement('meta');desc.name='description';document.head.append(desc);}desc.content=description;
    let canonical=document.querySelector('link[rel="canonical"]');if(!canonical){canonical=document.createElement('link');canonical.rel='canonical';document.head.append(canonical);}canonical.href=`${window.location.origin}${path}`;
    let og=document.querySelector('meta[property="og:title"]');if(!og){og=document.createElement('meta');og.setAttribute('property','og:title');document.head.append(og);}og.content=title;
    let ogd=document.querySelector('meta[property="og:description"]');if(!ogd){ogd=document.createElement('meta');ogd.setAttribute('property','og:description');document.head.append(ogd);}ogd.content=description;
  },[title,description,path]);return null;
}
function LocalBusiness(){useEffect(()=>{const id='la-local-business';let s=document.getElementById(id);if(!s){s=document.createElement('script');s.id=id;s.type='application/ld+json';document.head.append(s);}const update=settings=>{s.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Store","name":settings.business_name||'Lakshmi Agency',"address":{"@type":"PostalAddress","streetAddress":settings.address||'Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.',"addressLocality":"Chennai","postalCode":"600001","addressRegion":"Tamil Nadu","addressCountry":"IN"},"email":settings.email||'chennailakshmiagency@gmail.com',"telephone":(settings.phones||'80127 72734, 97872 12722, 044-45522370').split(',').map(v=>v.trim()),"taxID":settings.gst_number||'33CYHPS0640F1ZM',"description":"Industrial pumps, electric motors, plumbing goods, electrical goods, sanitary ware and industrial equipment supplier in Chennai."});};update({});api.get('/settings/public').then(r=>update(r.data)).catch(()=>{});},[]);return null;}
function HomeRoute(){const loc=useLocation();return <><Seo title="Industrial Pumps & Motors in Chennai | Lakshmi Agency" description="Explore pumps, electric motors, plumbing and industrial products from Lakshmi Agency in Parrys, Chennai. Request a quotation." path={loc.pathname}/><Home/></>}
function RouteSeo({title,description,children}){const loc=useLocation();return <><Seo title={`${title} | Lakshmi Agency Chennai`} description={description} path={loc.pathname}/>{children}</>}
function NotFound(){return <PageTitle eyebrow="PAGE NOT FOUND" title="We couldn't find that page." body="The page may have moved. Explore the product catalogue or contact our team for help."/>}

export default function App(){return <><LocalBusiness/><Suspense fallback={<div className="loading-state page-loading">Loading Lakshmi Agency…</div>}><Routes><Route path="/admin/*" element={<Admin/>}/><Route path="/account/*" element={<CustomerAccount/>}/><Route path="/" element={<Layout><HomeRoute/></Layout>}/><Route path="/products" element={<Layout><RouteSeo title="Product Catalogue" description="Browse the Lakshmi Agency industrial product catalogue by category, brand and product name."><Products/></RouteSeo></Layout>}/><Route path="/products/:slug" element={<Layout><RouteSeo title="Product Details" description="Review product details and request a quotation from Lakshmi Agency."><ProductDetail/></RouteSeo></Layout>}/><Route path="/brands" element={<Layout><RouteSeo title="Brands" description="Explore brands associated with Lakshmi Agency's industrial and domestic product categories."><Brands/></RouteSeo></Layout>}/><Route path="/brands/:slug" element={<Layout><RouteSeo title="Brand Products" description="Browse listed brand products or contact Lakshmi Agency for availability."><BrandDetail/></RouteSeo></Layout>}/><Route path="/about" element={<Layout><RouteSeo title="About Us" description="Learn about Lakshmi Agency, a supplier of pumps, motors and engineering products in Parrys, Chennai."><About/></RouteSeo></Layout>}/><Route path="/services" element={<Layout><RouteSeo title="Product Services" description="Product supply and enquiry services for domestic, commercial and industrial requirements in Chennai."><Services/></RouteSeo></Layout>}/><Route path="/contact" element={<Layout><RouteSeo title="Contact" description="Contact Lakshmi Agency in Parrys, Chennai for product information and quotation enquiries."><Contact/></RouteSeo></Layout>}/><Route path="/quote" element={<Layout><RouteSeo title="Request a Quote" description="Request product availability and quotations from Lakshmi Agency in Chennai."><Quote/></RouteSeo></Layout>}/><Route path="*" element={<Layout><NotFound/></Layout>}/></Routes></Suspense></>}
