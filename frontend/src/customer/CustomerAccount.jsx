import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Boxes, Check, Clock3, FileText, KeyRound, LogOut, Package, Phone, ShieldCheck, UserRound, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api.js';
import { SiteLogo } from '../components/SiteLogo.jsx';

const clearCustomer = () => {
  localStorage.removeItem('la_customer_token');
  localStorage.removeItem('la_customer_name');
};

function AuthScreen({ mode }) {
  const register = mode === 'register';
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', companyName: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('la_customer_token')) navigate('/account/dashboard', { replace: true });
  }, [navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (register && form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(register ? '/customer/auth/register' : '/customer/auth/login', form);
      localStorage.setItem('la_customer_token', data.token);
      localStorage.setItem('la_customer_name', data.customer.name);
      navigate('/account/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'We could not connect to the account service. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <main className="customer-auth-page">
    <Link className="customer-auth-back" to="/"><ArrowLeft size={15}/> Back to Lakshmi Agency</Link>
    <div className="customer-auth-shell">
      <section className="customer-auth-visual">
        <div className="customer-auth-photo"/>
        <div className="customer-auth-top"><span>LA / CUSTOMER DESK</span><span>CHENNAI · PARRYS</span></div>
        <motion.div className="customer-auth-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
          <span>YOUR REQUIREMENTS, IN VIEW</span>
          <h1>{register ? <>Start with the<br/>right connection.</> : <>Keep every<br/>request moving.</>}</h1>
          <p>Send product requirements, track quotation progress and keep your contact details in one place.</p>
        </motion.div>
        <div className="customer-auth-bottom"><span>PRODUCTS / SOURCING / SUPPORT</span><span>LAKSHMI AGENCY</span></div>
      </section>
      <section className="customer-auth-form-panel">
        <button type="button" className="customer-admin-key" onClick={() => setAdminOpen(true)} aria-label="Open admin workspace" title="Admin workspace"><KeyRound size={15}/></button>
        <span className="customer-auth-mark"><SiteLogo className="auth-logo"/></span>
        <span className="customer-auth-kicker">CUSTOMER WORKSPACE</span>
        <h2>{register ? 'Create your account.' : 'Welcome back.'}</h2>
        <p>{register ? 'Create an account to follow your quotation requests.' : 'Sign in to view your requirements and updates.'}</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          {register && <>
            <label>Full name<input required minLength="2" maxLength="160" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"/></label>
            <label>Company <span>OPTIONAL</span><input maxLength="180" autoComplete="organization" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Company or organization"/></label>
            <label>Mobile number<input required minLength="7" maxLength="40" autoComplete="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Your contact number"/></label>
          </>}
          <label>Email address<input required type="email" maxLength="190" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/></label>
          <label>Password<input required type="password" minLength={register ? 12 : 1} maxLength="200" autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={register ? 'At least 12 characters' : 'Your password'}/></label>
          {register && <label>Confirm password<input required type="password" minLength="12" maxLength="200" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Enter your password again"/></label>}
          <button className="customer-auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create customer account' : 'Sign in to your account'} <ArrowRight size={17}/></button>
        </form>
        <div className="customer-auth-switch">{register ? 'Already have an account?' : 'New to Lakshmi Agency?'} <Link to={register ? '/account/login' : '/account/register'}>{register ? 'Sign in' : 'Create an account'} <ArrowUpRight size={14}/></Link></div>
        <div className="customer-auth-footnote"><ShieldCheck size={14}/> Secure customer account · Product prices confirmed by quotation</div>
        {adminOpen && <AdminAccess onClose={() => setAdminOpen(false)} />}
      </section>
    </div>
    <div className="customer-auth-footer">CUSTOMER ACCESS <span>·</span> LAKSHMI AGENCY, PARRYS</div>
  </main>;
}

function AdminAccess({ onClose }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', secret: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const register = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (register && form.password !== form.confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const payload = register
        ? { name: form.name, email: form.email, password: form.password, secret: form.secret }
        : { email: form.email, password: form.password };
      const { data } = await api.post(register ? '/admin/auth/register' : '/admin/auth/login', payload);
      localStorage.setItem('la_admin_token', data.token);
      localStorage.setItem('la_admin_name', data.admin.name);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to continue. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="admin-access-backdrop" onMouseDown={onClose}>
    <div className="admin-access-card" onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="admin-access-close" onClick={onClose} aria-label="Close"><X size={16}/></button>
      <span className="admin-access-icon"><KeyRound size={18}/></span>
      <span className="admin-access-kicker">LAKSHMI AGENCY / PRIVATE</span>
      <h3>{register ? 'Create admin account.' : 'Admin sign in.'}</h3>
      <p>{register ? 'Restricted registration. Enter the server secret to continue.' : 'Manage catalogue, enquiries and site content.'}</p>
      <div className="admin-access-tabs">
        <button type="button" className={!register ? 'active' : ''} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
        <button type="button" className={register ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Register</button>
      </div>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={submit}>
        {register && <label>Full name<input required minLength="2" maxLength="120" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admin name"/></label>}
        <label>Email address<input required type="email" maxLength="190" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com"/></label>
        <label>Password<input required type="password" minLength={register ? 12 : 1} maxLength="200" autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={register ? 'At least 12 characters' : 'Your password'}/></label>
        {register && <>
          <label>Confirm password<input required type="password" minLength="12" maxLength="200" autoComplete="new-password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password"/></label>
          <label>Secret code<input required type="password" maxLength="200" autoComplete="off" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} placeholder="Server secret"/></label>
        </>}
        <button className="admin-access-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create admin account' : 'Enter workspace'} <ArrowRight size={16}/></button>
      </form>
      <div className="admin-access-note"><ShieldCheck size={13}/> Secret is verified on the server, never stored in the browser.</div>
    </div>
  </div>;
}

function PortalShell() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/customer/me').then((res) => setCustomer(res.data)).catch((err) => {
      if (err.response?.status === 401) {
        clearCustomer();
        navigate('/account/login', { replace: true });
      } else setError('Your account workspace could not connect. Please check the customer service and try again.');
    });
  }, [navigate]);
  const logout = () => { clearCustomer(); navigate('/account/login', { replace: true }); };
  if (!localStorage.getItem('la_customer_token')) return <Navigate to="/account/login" replace/>;
  if (!customer) return <div className="customer-portal-loading">{error || 'Opening your customer workspace…'}</div>;
  return <div className="customer-portal">
    <aside className="customer-rail">
      <Link to="/" className="customer-brand"><span className="customer-brand-mark"><SiteLogo className="customer-brand-img"/></span><b>LAKSHMI AGENCY<small>CUSTOMER WORKSPACE</small></b></Link>
      <div className="customer-rail-label">YOUR ACCOUNT</div>
      <nav>
        <NavLink to="/account/dashboard"><Boxes size={16}/> Overview</NavLink>
        <NavLink to="/account/requests"><FileText size={16}/> My enquiries</NavLink>
        <NavLink to="/account/profile"><UserRound size={16}/> Profile & security</NavLink>
      </nav>
      <div className="customer-rail-bottom">
        <div className="customer-rail-user"><span>{customer.name.slice(0, 1).toUpperCase()}</span><div><b>{customer.name}</b><small>{customer.company_name || customer.email}</small></div></div>
        <button onClick={logout}><LogOut size={15}/> Sign out</button>
        <Link to="/" className="customer-back-site"><ArrowLeft size={15}/> Back to website</Link>
      </div>
    </aside>
    <main className="customer-portal-main">
      <header className="customer-portal-top"><div><span>LAKSHMI AGENCY / CUSTOMER DESK</span><b>Requirement workspace</b></div><Link to="/quote" className="customer-top-quote">New quotation request <ArrowUpRight size={16}/></Link></header>
      <div className="customer-portal-content">
        <Routes>
          <Route index element={<Navigate to="dashboard" replace/>}/>
          <Route path="dashboard" element={<CustomerDashboard customer={customer}/>}/>
          <Route path="requests" element={<CustomerRequests/>}/>
          <Route path="profile" element={<CustomerProfile customer={customer} onUpdate={setCustomer}/>}/>
          <Route path="*" element={<Navigate to="dashboard" replace/>}/>
        </Routes>
      </div>
    </main>
  </div>;
}

function PortalHeading({ eyebrow, title, body, action }) {
  return <div className="customer-page-heading"><div><span>{eyebrow}</span><h1>{title}</h1>{body && <p>{body}</p>}</div>{action}</div>;
}

function CustomerDashboard({ customer }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/customer/dashboard').then((res) => setData(res.data)).catch((err) => setError(err.response?.data?.error || 'Unable to load your enquiry history.')); }, []);
  const metrics = data?.metrics || {};
  const recent = data?.requests?.slice(0, 5) || [];
  return <>
    <PortalHeading eyebrow="CUSTOMER OVERVIEW / 01" title={<>Hello, {customer.name.split(' ')[0]}.</>} body="Your product requirements and quotation updates, in one place." action={<Link className="customer-action-button" to="/quote">Request a quotation <ArrowRight size={16}/></Link>}/>
    {error && <div className="form-error">{error}</div>}
    <section className="customer-welcome-card"><div><span>LA / CUSTOMER DESK</span><h2>Clear next steps<br/><i>for every requirement.</i></h2><p>Share a product, capacity, quantity or brand preference. Our team will update your request as it moves forward.</p></div><div className="customer-welcome-art"><span/><span/><span/><b>SPEC<br/>→ QUOTE<br/>→ SUPPLY</b></div></section>
    <div className="customer-metrics">
      <CustomerMetric label="Total enquiries" value={metrics.total_requests} icon={FileText}/>
      <CustomerMetric label="In progress" value={metrics.active_requests} icon={Clock3}/>
      <CustomerMetric label="Quotations sent" value={metrics.quotations_sent} icon={Package}/>
      <CustomerMetric label="Completed" value={metrics.completed_requests} icon={Check}/>
    </div>
    <section className="customer-panel">
      <div className="customer-panel-head"><div><span>01 / RECENT ACTIVITY</span><h2>Your latest enquiries</h2><p>Follow-up status from the Lakshmi Agency team.</p></div><Link to="/account/requests">View all <ArrowRight size={15}/></Link></div>
      <RequestTable rows={recent}/>
      {!recent.length && !error && <div className="customer-empty"><span><FileText size={23}/></span><b>Your first request starts here.</b><p>Send us a product or project requirement and we’ll keep its progress visible in your account.</p><Link to="/quote">Create an enquiry <ArrowUpRight size={15}/></Link></div>}
    </section>
    <div className="customer-dashboard-bottom"><div><span>NEED A DIFFERENT PRODUCT?</span><b>Send your next requirement when you’re ready.</b></div><Link to="/products">Explore the catalogue <ArrowRight size={15}/></Link></div>
  </>;
}

function CustomerMetric({ label, value, icon: Icon }) {
  return <div className="customer-metric"><span><Icon size={17}/></span><small>{label}</small><b>{value ?? '—'}</b></div>;
}

function CustomerRequests() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/customer/dashboard').then((res) => setRows(res.data.requests || [])).catch((err) => setError(err.response?.data?.error || 'Unable to load your requests.')); }, []);
  return <>
    <PortalHeading eyebrow="CUSTOMER OVERVIEW / 02" title="My enquiries" body="Each request stays here while our team checks product, price and availability." action={<Link className="customer-action-button" to="/quote">New request <ArrowRight size={16}/></Link>}/>
    {error && <div className="form-error">{error}</div>}
    <section className="customer-panel"><div className="customer-panel-head"><div><span>REQUEST HISTORY</span><h2>Quotation and product enquiries</h2><p>Status is updated by the Lakshmi Agency team.</p></div></div><RequestTable rows={rows}/>{!rows.length && !error && <div className="customer-empty"><span><FileText size={23}/></span><b>No enquiries yet.</b><p>Once you submit a requirement, its reference and progress will appear here.</p><Link to="/quote">Start a product enquiry <ArrowUpRight size={15}/></Link></div>}</section>
  </>;
}

function RequestTable({ rows }) {
  return <div className="customer-table-wrap"><table><thead><tr><th>Reference</th><th>Requirement</th><th>Quantity</th><th>Status</th><th>Submitted</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><b>{row.reference_no}</b><small>{row.category_name || 'Product enquiry'}</small></td><td>{row.product_name || row.message || 'General requirement'}</td><td>{row.quantity || '—'}</td><td><span className={`customer-status customer-status--${row.status.toLowerCase().replace(/[^a-z]+/g, '-')}`}>{row.status}</span></td><td>{new Date(row.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td></tr>)}</tbody></table></div>;
}

function CustomerProfile({ customer, onUpdate }) {
  const [form, setForm] = useState({ name: customer.name, companyName: customer.company_name || '', mobile: customer.mobile });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [notice, setNotice] = useState({ text: '', error: false });
  const saveProfile = async (event) => {
    event.preventDefault(); setNotice({ text: '', error: false });
    try { const { data } = await api.patch('/customer/me', form); onUpdate(data); localStorage.setItem('la_customer_name', data.name); setNotice({ text: 'Your profile has been updated.', error: false }); }
    catch (err) { setNotice({ text: err.response?.data?.error || 'Unable to update your profile.', error: true }); }
  };
  const savePassword = async (event) => {
    event.preventDefault(); setNotice({ text: '', error: false });
    try { await api.post('/customer/auth/change-password', password); setPassword({ currentPassword: '', newPassword: '' }); setNotice({ text: 'Your password has been changed.', error: false }); }
    catch (err) { setNotice({ text: err.response?.data?.error || 'Unable to change your password.', error: true }); }
  };
  return <>
    <PortalHeading eyebrow="CUSTOMER OVERVIEW / 03" title="Profile & security" body="Keep your contact details ready for the next quotation or product update."/>
    {notice.text && <div className={notice.error ? 'form-error' : 'customer-success'}>{notice.error ? <X size={15}/> : <Check size={15}/>} {notice.text}</div>}
    <div className="customer-profile-grid"><section className="customer-panel"><div className="customer-panel-head"><div><span>CONTACT DETAILS</span><h2>Profile information</h2><p>We use these details to follow up on your enquiries.</p></div></div><form className="customer-profile-form" onSubmit={saveProfile}><label>Full name<input required minLength="2" maxLength="160" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label><label>Company name<input maxLength="180" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}/></label><label>Email address<input readOnly value={customer.email}/><small>Email address is used as your account identifier.</small></label><label>Mobile number<input required minLength="7" maxLength="40" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}/></label><button className="customer-action-button">Save profile <Check size={15}/></button></form></section>
      <section className="customer-panel customer-security-panel"><div className="customer-panel-head"><div><span>ACCOUNT SECURITY</span><h2>Change password</h2><p>Use a unique password of at least 12 characters.</p></div></div><form className="customer-profile-form" onSubmit={savePassword}><label>Current password<input required type="password" autoComplete="current-password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}/></label><label>New password<input required minLength="12" type="password" autoComplete="new-password" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}/></label><div className="customer-security-note"><KeyRound size={16}/><span>Password is stored as a secure hash and never shown in your account.</span></div><button className="customer-action-button">Update password <ArrowRight size={15}/></button></form></section></div>
  </>;
}

export default function CustomerAccount() {
  const location = useLocation();
  const hasToken = Boolean(localStorage.getItem('la_customer_token'));
  return <Routes>
    <Route path="login" element={<AuthScreen key="login" mode="login"/>}/>
    <Route path="register" element={<AuthScreen key="register" mode="register"/>}/>
    <Route path="*" element={hasToken ? <PortalShell/> : <Navigate to="/account/login" state={{ from: location.pathname }} replace/>}/>
  </Routes>;
}
