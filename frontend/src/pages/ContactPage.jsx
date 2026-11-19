import { useEffect, useState } from 'react';
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import { api } from '../services/api.js';
import { PageTitle } from '../components/Site.jsx';
import { EnquiryForm } from './PublicPages.jsx';

const defaultAddress='Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001, Tamil Nadu, India.';

export default function ContactPage(){
  const [settings,setSettings]=useState({}),[content,setContent]=useState(null);
  useEffect(()=>{
    Promise.all([api.get('/settings/public'),api.get('/content/contact')]).then(([s,c])=>{setSettings(s.data);setContent(c.data);if(c.data?.meta_title)document.title=c.data.meta_title;const meta=document.querySelector('meta[name="description"]');if(meta&&c.data?.meta_description)meta.content=c.data.meta_description;}).catch(()=>{});
  },[]);
  const address=settings.address||defaultAddress;
  const phones=(settings.phones||'80127 72734, 97872 12722, 044-45522370').split(',').map(v=>v.trim()).filter(Boolean);
  const email=settings.email||'chennailakshmiagency@gmail.com';
  const location=settings.google_maps_query||'Angappa Naicken Street, Parrys, Chennai 600001';
  const mapQuery=encodeURIComponent(location);
  return <>
    <PageTitle eyebrow="CONTACT US" title={content?.title||'Talk with Lakshmi Agency.'} body={content?.body||'Reach our team for product information, availability, quotations and bulk or industrial purchase enquiries.'}/>
    <section className="section contact-section"><div className="wrap contact-grid">
      <div className="contact-details"><span className="eyebrow">VISIT OR GET IN TOUCH</span><h2>We're in the heart of Parrys.</h2><p>Contact us by phone or email, or visit our store on Angappa Naicken Street.</p>
        <div className="contact-card"><span><MapPin/></span><div><small>BUSINESS ADDRESS</small><b>{address}</b></div></div>
        <div className="contact-card"><span><Phone/></span><div><small>PHONE NUMBERS</small>{phones.map((p,i)=><a key={i} href={`tel:${p.replace(/[^\d+]/g,'')}`}>{p}</a>)}</div></div>
        <div className="contact-card"><span><Mail/></span><div><small>EMAIL</small><a href={`mailto:${email}`}>{email}</a></div></div>
        {settings.gst_number&&<div className="contact-gst">GST Registration <b>{settings.gst_number}</b></div>}
      </div>
      <div className="map-wrap"><iframe title="Lakshmi Agency location map" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}/><div className="map-label"><MapPin size={16}/><span><b>Find us in Parrys</b><small>{location}</small></span><a href={`https://maps.google.com/?q=${mapQuery}`} target="_blank" rel="noreferrer"><ArrowUpRight size={16}/></a></div></div>
    </div></section>
    <section className="contact-form-band"><div className="wrap contact-form-grid"><div><span className="eyebrow">SEND AN ENQUIRY</span><h2>Tell us how we can help.</h2><p>Our team can help direct your message to the relevant product enquiry.</p></div><EnquiryForm/></div></section>
  </>;
}
