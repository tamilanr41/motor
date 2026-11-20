import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { adminService } from './adminService.js';
import { SITE_LOGO, SiteLogo } from '../components/SiteLogo.jsx';
import './admin.css';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tags,
  Users,
  CircleUserRound,
  ImagePlus,
  Settings,
  FileText,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Phone,
  MessageSquare,
  Mail,
  Printer,
  Download,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Building,
  Key,
  Lock,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

/* ==========================================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================================== */
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="adm-toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`adm-toast ${t.type || 'info'}`}>
          {t.type === 'success' && <CheckCircle2 size={16} color="#10b981" />}
          {t.type === 'error' && <AlertCircle size={16} color="#ef4444" />}
          {t.type === 'info' && <Sparkles size={16} color="#38bdf8" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ==========================================================================
   IMAGE DEVICE UPLOADER COMPONENT (LOCAL STORAGE & DEVICE CAMERA/FILE PICKER)
   ========================================================================== */
function ImageDeviceUploader({
  value,
  onChange,
  label = 'Image',
  helperText,
  aspectRatio = 'square',
  recommendedSize = 'PNG, JPG, WebP (Max 12MB)',
  onToast
}) {
  const [uploading, setUploading] = useState(false);
  const [showUrlEdit, setShowUrlEdit] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      if (onToast) onToast('Image is larger than 12MB. Please select a smaller photo.', 'error');
      return;
    }

    setUploading(true);
    try {
      const url = await adminService.uploadAsset(file);
      onChange(url);
      if (onToast) onToast('Image loaded successfully from device', 'success');
    } catch (err) {
      if (onToast) onToast(err.message || 'Failed to read image file from device', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="adm-image-uploader">
      <div className="adm-uploader-header">
        <label className="adm-label" style={{ marginBottom: 0 }}>
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="adm-uploader-remove-btn"
            title="Remove image"
          >
            <Trash2 size={12} /> Remove
          </button>
        )}
      </div>

      <div className="adm-uploader-card">
        {value ? (
          <div className="adm-uploader-preview-wrap">
            <div className={`adm-uploader-preview ${aspectRatio}`}>
              <img
                src={value}
                alt="Upload preview"
                onError={(e) => {
                  e.target.style.opacity = '0.3';
                }}
              />
            </div>
            <div className="adm-uploader-preview-info">
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>
                Image attached
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', wordBreak: 'break-all' }}>
                {value.startsWith('data:')
                  ? 'Local device image (stored securely)'
                  : (value.length > 45 ? value.substring(0, 42) + '...' : value)}
              </span>

              <div className="adm-uploader-preview-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="adm-uploader-btn primary"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={13} className="adm-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus size={13} /> Change from Device
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="adm-uploader-btn subtle"
                  onClick={() => setShowUrlEdit(!showUrlEdit)}
                >
                  {showUrlEdit ? 'Hide Link' : 'Edit Link'}
                </button>
              </div>

              {showUrlEdit && (
                <div className="adm-uploader-url-edit">
                  <input
                    type="text"
                    className="adm-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://... or paste image link"
                    style={{ fontSize: '11px', padding: '6px 8px' }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="adm-uploader-dropzone">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div
              className="adm-uploader-empty"
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <div className="adm-uploader-icon-circle">
                {uploading ? (
                  <RefreshCw size={22} className="adm-spin" />
                ) : (
                  <ImagePlus size={22} />
                )}
              </div>
              <div className="adm-uploader-text">
                <b>{uploading ? 'Processing local image...' : 'Choose image from this device'}</b>
                <span>Click to browse phone gallery or computer files</span>
                <small>{recommendedSize}</small>
              </div>
            </div>

            <div className="adm-uploader-divider">
              <span>OR</span>
            </div>

            <div>
              <input
                type="text"
                className="adm-input"
                placeholder="Paste direct image link (https://...)"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {helperText && <span className="adm-helper-text">{helperText}</span>}
    </div>
  );
}

/* ==========================================================================
   ADMIN LOGIN & REGISTRATION VIEW
   ========================================================================== */
export function AdminLogin() {
  const [mode, setMode] = useState('signin'); // 'signin' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your admin email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await adminService.login(email, password);
      localStorage.setItem('la_admin_token', res.token);
      localStorage.setItem('la_admin_name', res.admin.name);
      localStorage.setItem('la_admin_role', res.admin.role);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter the administrator full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter an admin email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!secretCode.trim()) {
      setError('Security Secret Code is required to create an admin account.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminService.register(name, email, password, secretCode);
      localStorage.setItem('la_admin_token', res.token);
      localStorage.setItem('la_admin_name', res.admin.name);
      localStorage.setItem('la_admin_role', res.admin.role);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Registration failed. Check the Secret Code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      position: 'relative'
    }}>
      <Link to="/" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        color: '#94a3b8',
        fontSize: '12px',
        textDecoration: 'none',
        fontWeight: '600'
      }}>
        ← Back to Lakshmi Agency Website
      </Link>

      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '480px',
        padding: '36px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: 'linear-gradient(135deg, #fa4729, #d9381e)',
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
            fontWeight: '800',
            fontSize: '16px',
            boxShadow: '0 4px 14px rgba(250, 71, 41, 0.4)'
          }}>
            LA
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Lakshmi Agency
            </h2>
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', color: '#fa4729', textTransform: 'uppercase' }}>
              Admin Operations Portal
            </span>
          </div>
        </div>

        {/* TABS: SIGN IN vs CREATE ADMIN ACCOUNT */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              background: mode === 'signin' ? '#ffffff' : 'transparent',
              color: mode === 'signin' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: mode === 'signin' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: 0,
              background: mode === 'register' ? '#ffffff' : 'transparent',
              color: mode === 'register' ? '#0f172a' : '#64748b',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer',
              boxShadow: mode === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Create Admin Account
          </button>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create new admin account'}
        </h1>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px' }}>
          {mode === 'signin'
            ? 'Sign in to manage product inventory, quotations and showroom operations.'
            : 'Enter your credentials and the authorized security secret code to create an admin account.'}
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} flexShrink={0} />
            <span>{error}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: '16px' }}>
              <label className="adm-label">Admin Email Address</label>
              <input
                type="email"
                required
                className="adm-input"
                placeholder="Enter your admin email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label className="adm-label">Security Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="adm-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="adm-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* CREATE ADMIN ACCOUNT FORM (WITH SECRET CODE) */
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '14px' }}>
              <label className="adm-label">Full Name <span>*</span></label>
              <input
                type="text"
                required
                className="adm-input"
                placeholder="e.g. M. Senthil Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="adm-label">Admin Email Address <span>*</span></label>
              <input
                type="email"
                required
                className="adm-input"
                placeholder="e.g. senthil@lakshmiagency.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="adm-label">New Password <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="adm-input"
                  style={{ paddingRight: '40px' }}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 0,
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label className="adm-label">Confirm Password <span>*</span></label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                className="adm-input"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label className="adm-label">
                Security Secret Code <span>*</span>
              </label>
              <input
                type="password"
                required
                className="adm-input"
                placeholder="Enter authorized secret code"
                value={secretCode}
                onChange={e => setSecretCode(e.target.value)}
              />
              <span className="adm-helper-text">
                Restricted access. An authorized secret code is required to create an admin account.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="adm-btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '13px' }}
            >
              {loading ? 'Verifying & Creating...' : 'Verify Secret & Create Account'} <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '10px', color: '#94a3b8' }}>
          <ShieldCheck size={14} color="#10b981" /> 256-bit Encrypted Session · Secret Code Protected
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN ADMIN SHELL (SIDEBAR + TOPBAR + ROUTER)
   ========================================================================== */
export default function Admin() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const token = localStorage.getItem('la_admin_token');
    if (!token) return;

    adminService.getMe()
      .then(data => setAdmin(data))
      .catch(() => {
        localStorage.removeItem('la_admin_token');
        localStorage.removeItem('la_admin_name');
        localStorage.removeItem('la_admin_role');
        navigate('/admin');
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('la_admin_token');
    localStorage.removeItem('la_admin_name');
    localStorage.removeItem('la_admin_role');
    navigate('/admin');
  };

  const token = localStorage.getItem('la_admin_token');

  return (
    <Routes>
      <Route
        index
        element={token ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />}
      />
      <Route
        path="/*"
        element={
          !token ? (
            <Navigate to="/admin" replace />
          ) : (
            <div className="adm-app">
              <ToastContainer toasts={toasts} removeToast={removeToast} />

              {/* SIDEBAR NAVIGATION */}
              <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <Link to="/admin/dashboard" className="adm-brand">
                  <div className="adm-brand-logo">LA</div>
                  <div className="adm-brand-text">
                    <b>LAKSHMI AGENCY</b>
                    <small>Control Center</small>
                  </div>
                </Link>

                <div className="adm-nav-container">
                  <div className="adm-nav-section-title">Core Operations</div>
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Overview Desk</span>
                  </NavLink>

                  <NavLink
                    to="/admin/enquiries"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Users size={18} />
                    <span>Quotation Enquiries</span>
                    <span className="adm-nav-badge">Live</span>
                  </NavLink>

                  <NavLink
                    to="/admin/products"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Package size={18} />
                    <span>Products Inventory</span>
                  </NavLink>

                  <NavLink
                    to="/admin/categories"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Boxes size={18} />
                    <span>Categories & Sub</span>
                  </NavLink>

                  <NavLink
                    to="/admin/brands"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Tags size={18} />
                    <span>Brand Partners</span>
                  </NavLink>

                  <div className="adm-nav-section-title">Customers & Sales</div>
                  <NavLink
                    to="/admin/customers"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <CircleUserRound size={18} />
                    <span>Customer Accounts</span>
                  </NavLink>

                  <NavLink
                    to="/admin/banners"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <ImagePlus size={18} />
                    <span>Homepage Banners</span>
                  </NavLink>

                  <NavLink
                    to="/admin/review"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <FileSpreadsheet size={18} />
                    <span>Catalogue Review</span>
                  </NavLink>

                  <div className="adm-nav-section-title">Administration</div>
                  <NavLink
                    to="/admin/content"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <FileText size={18} />
                    <span>Page Content & SEO</span>
                  </NavLink>

                  <NavLink
                    to="/admin/activity"
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Activity size={18} />
                    <span>Audit Activity Logs</span>
                  </NavLink>

                  {(!admin || admin.role === 'owner') && (
                    <>
                      <NavLink
                        to="/admin/team"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <ShieldCheck size={18} />
                        <span>Admin Staff & Roles</span>
                      </NavLink>

                      <NavLink
                        to="/admin/settings"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) => `adm-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <Settings size={18} />
                        <span>Business & Bank Info</span>
                      </NavLink>
                    </>
                  )}
                </div>

                <div className="adm-sidebar-footer">
                  <div className="adm-user-profile">
                    <div className="adm-user-avatar">
                      {admin?.name ? admin.name.charAt(0) : 'A'}
                    </div>
                    <div className="adm-user-info">
                      <b>{admin?.name || 'Administrator'}</b>
                      <span>Role: {admin?.role || 'Owner'}</span>
                    </div>
                  </div>

                  <div className="adm-sidebar-actions">
                    <Link to="/" target="_blank" rel="noreferrer" className="adm-btn-subtle" title="Open Public Website">
                      <ExternalLink size={13} /> Website
                    </Link>
                    <button onClick={handleLogout} className="adm-btn-subtle" style={{ color: '#f87171' }} title="Log out">
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              </aside>

              {/* Mobile Sidebar Overlay */}
              {sidebarOpen && (
                <div
                  className="adm-sidebar-overlay open"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}

              {/* MAIN BODY AREA */}
              <div className="adm-main">
                {/* TOPBAR */}
                <header className="adm-topbar">
                  <div className="adm-topbar-left">
                    <button
                      className="adm-mobile-toggle"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      aria-label="Toggle Navigation"
                    >
                      {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <div className="adm-topbar-title">
                      <b>Lakshmi Agency · Parrys Showroom</b>
                      <span>Pumps · Motors · Plumbing & Electrical Engineering Goods</span>
                    </div>
                  </div>

                  <div className="adm-topbar-right">
                    <div className="adm-status-pill">
                      <span className="adm-status-dot"></span>
                      <span>Operational Session</span>
                    </div>

                    <Link to="/" target="_blank" rel="noreferrer" className="adm-view-site-link">
                      <ExternalLink size={13} /> View Website
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="adm-btn-secondary"
                      style={{ padding: '7px 12px', fontSize: '11px', color: '#ef4444' }}
                      title="End session"
                    >
                      <LogOut size={14} /> Exit
                    </button>
                  </div>
                </header>

                {/* CONTENT ROUTING */}
                <div className="adm-body">
                  <Routes>
                    <Route path="dashboard" element={<DashboardView addToast={addToast} />} />
                    <Route path="enquiries" element={<EnquiryManagerView addToast={addToast} />} />
                    <Route path="products" element={<ProductManagerView addToast={addToast} />} />
                    <Route path="categories" element={<CategoryManagerView addToast={addToast} />} />
                    <Route path="brands" element={<BrandManagerView addToast={addToast} />} />
                    <Route path="customers" element={<CustomerManagerView addToast={addToast} />} />
                    <Route path="banners" element={<BannerManagerView addToast={addToast} />} />
                    <Route path="review" element={<CatalogueReviewView addToast={addToast} />} />
                    <Route path="content" element={<ContentManagerView addToast={addToast} />} />
                    <Route path="activity" element={<ActivityLogView addToast={addToast} />} />
                    <Route path="team" element={<TeamManagerView addToast={addToast} />} />
                    <Route path="settings" element={<WebsiteSettingsView addToast={addToast} />} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </div>
              </div>
            </div>
          )
        }
      />
    </Routes>
  );
}

/* ==========================================================================
   VIEW 1: OVERVIEW DASHBOARD
   ========================================================================== */
function DashboardView({ addToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const navigate = useNavigate();

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await adminService.getOverview();
      setData(res);
    } catch {
      addToast('Could not load overview statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const handleQuickStatusChange = async (enquiryId, newStatus) => {
    try {
      await adminService.updateEnquiry(enquiryId, { status: newStatus });
      addToast(`Enquiry status updated to "${newStatus}"`, 'success');
      loadOverview();
    } catch {
      addToast('Failed to update enquiry status', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Operations Overview</h1>
          <p>Real-time status of enquiries, stock availability and store activity · {todayFormatted}</p>
        </div>
        <div className="adm-head-actions">
          <button onClick={() => navigate('/admin/products')} className="adm-btn-primary">
            <Plus size={16} /> Add Product
          </button>
          <button onClick={() => navigate('/admin/enquiries')} className="adm-btn-secondary">
            <Users size={16} /> Open Enquiry Desk
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="adm-metrics-grid">
        <div className="adm-metric-card">
          <div className="adm-metric-icon orange">
            <Package size={22} />
          </div>
          <div className="adm-metric-data">
            <div className="adm-metric-label">Catalogue Products</div>
            <div className="adm-metric-num">{data?.total_products || 0}</div>
            <div className="adm-metric-footnote">
              <Link to="/admin/products" style={{ color: '#fa4729', textDecoration: 'none', fontWeight: '700' }}>
                Manage catalog →
              </Link>
            </div>
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-icon blue">
            <Users size={22} />
          </div>
          <div className="adm-metric-data">
            <div className="adm-metric-label">Total Quotations</div>
            <div className="adm-metric-num">{data?.total_enquiries || 0}</div>
            <div className="adm-metric-footnote">
              <span style={{ color: '#0284c7', fontWeight: '600' }}>{data?.new_enquiries || 0} New requests</span>
            </div>
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-icon amber">
            <TrendingUp size={22} />
          </div>
          <div className="adm-metric-data">
            <div className="adm-metric-label">Pending Follow-up</div>
            <div className="adm-metric-num">{data?.pending_quotations || 0}</div>
            <div className="adm-metric-footnote">
              <span style={{ color: '#d97706', fontWeight: '600' }}>Action required today</span>
            </div>
          </div>
        </div>

        <div className="adm-metric-card">
          <div className="adm-metric-icon green">
            <CircleUserRound size={22} />
          </div>
          <div className="adm-metric-data">
            <div className="adm-metric-label">Registered Customers</div>
            <div className="adm-metric-num">{data?.total_customers || 0}</div>
            <div className="adm-metric-footnote">
              <Link to="/admin/customers" style={{ color: '#10b981', textDecoration: 'none', fontWeight: '700' }}>
                View directory →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BANNER */}
      <div className="adm-quick-actions-bar">
        <div className="adm-quick-copy">
          <h3>⚡ Quick Showroom Actions</h3>
          <p>Instant shortcuts for Parrys store staff to log inquiries and update inventory.</p>
        </div>
        <div className="adm-quick-btns">
          <button onClick={() => navigate('/admin/enquiries?action=new')} className="adm-quick-btn">
            <Plus size={14} /> Log Walk-in Enquiry
          </button>
          <button onClick={() => navigate('/admin/products?action=new')} className="adm-quick-btn">
            <Package size={14} /> New Product SKU
          </button>
          <button onClick={() => navigate('/admin/banners')} className="adm-quick-btn">
            <ImagePlus size={14} /> Update Banners
          </button>
          <button onClick={() => navigate('/admin/settings')} className="adm-quick-btn">
            <Settings size={14} /> Store Settings
          </button>
        </div>
      </div>

      {/* RECENT ENQUIRIES TABLE */}
      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2>
            <Users size={18} color="#fa4729" />
            Recent Customer Quotation Enquiries
            <span className="adm-pill-count">{data?.recent?.length || 0} Recent</span>
          </h2>
          <Link to="/admin/enquiries" className="adm-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
            View All Enquiries →
          </Link>
        </div>

        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Reference / Customer</th>
                <th>Requirement</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Received</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent || []).map(enq => (
                <tr key={enq.id}>
                  <td>
                    <span className="adm-table-primary-text">{enq.reference_no}</span>
                    <span className="adm-table-subtext">
                      {enq.customer_name} {enq.company_name ? `(${enq.company_name})` : ''}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#0f172a' }}>{enq.product_name || 'General Inquiry'}</span>
                    {enq.quantity && <span className="adm-table-subtext">Qty: {enq.quantity}</span>}
                  </td>
                  <td>
                    <a
                      href={`tel:${enq.mobile}`}
                      style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Phone size={12} /> {enq.mobile}
                    </a>
                  </td>
                  <td>
                    <select
                      value={enq.status}
                      onChange={e => handleQuickStatusChange(enq.id, e.target.value)}
                      className="adm-select"
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        width: 'auto',
                        borderColor: '#cbd5e1'
                      }}
                    >
                      {['New', 'Contacted', 'Quotation Sent', 'Follow-up', 'Converted', 'Closed'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(enq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <a
                        href={`https://wa.me/${enq.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${enq.customer_name}, regarding your quotation request (${enq.reference_no}) with Lakshmi Agency Chennai for ${enq.product_name}...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-btn-whatsapp"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </a>
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="adm-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <Eye size={13} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data?.recent || data.recent.length === 0) && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No customer enquiries registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK DETAILS MODAL */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onUpdated={() => {
            loadOverview();
            setSelectedEnquiry(null);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   VIEW 2: ENQUIRY & QUOTATION DESK (COMPREHENSIVE)
   ========================================================================== */
function EnquiryManagerView({ addToast }) {
  const [enquiries, setEnquiries] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const loadEnquiries = async () => {
    setLoading(true);
    try {
      const data = await adminService.getEnquiries();
      setEnquiries(data);
    } catch {
      addToast('Error loading enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, []);

  const filteredEnquiries = useMemo(() => {
    let list = enquiries;
    if (activeTab !== 'All') {
      list = list.filter(e => e.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.customer_name?.toLowerCase().includes(q) ||
        e.company_name?.toLowerCase().includes(q) ||
        e.reference_no?.toLowerCase().includes(q) ||
        e.mobile?.includes(q) ||
        e.product_name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [enquiries, activeTab, search]);

  const exportCSV = () => {
    const headers = ['Reference No', 'Customer Name', 'Company', 'Mobile', 'Email', 'Product', 'Quantity', 'Status', 'Date'];
    const rows = filteredEnquiries.map(e => [
      `"${e.reference_no}"`,
      `"${e.customer_name}"`,
      `"${e.company_name || ''}"`,
      `"${e.mobile}"`,
      `"${e.email || ''}"`,
      `"${e.product_name || ''}"`,
      `"${e.quantity || ''}"`,
      `"${e.status}"`,
      `"${new Date(e.created_at).toLocaleDateString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lakshmi_agency_enquiries_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Enquiries exported to CSV', 'success');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry record?')) return;
    try {
      await adminService.deleteEnquiry(id);
      addToast('Enquiry deleted', 'info');
      loadEnquiries();
    } catch {
      addToast('Failed to delete enquiry', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Customer Quotation Desk</h1>
          <p>Review requirements, issue quotation slips, and communicate with customers via WhatsApp.</p>
        </div>
        <div className="adm-head-actions">
          <button onClick={() => setShowNewModal(true)} className="adm-btn-primary">
            <Plus size={16} /> Log Walk-in Enquiry
          </button>
          <button onClick={exportCSV} className="adm-btn-secondary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="adm-panel">
        {/* FILTER & SEARCH BAR */}
        <div className="adm-filter-bar">
          <div className="adm-tabs">
            {['All', 'New', 'Contacted', 'Quotation Sent', 'Follow-up', 'Converted', 'Closed'].map(tab => {
              const count = tab === 'All' ? enquiries.length : enquiries.filter(e => e.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`adm-tab-btn ${activeTab === tab ? 'active' : ''}`}
                >
                  {tab}
                  {count > 0 && <span className="adm-pill-count">{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="adm-search-input">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search reference, customer, mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer / Company</th>
                <th>Requirement & Qty</th>
                <th>Mobile / Email</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map(enq => (
                <tr key={enq.id}>
                  <td>
                    <b style={{ color: '#fa4729', letterSpacing: '0.04em' }}>{enq.reference_no}</b>
                  </td>
                  <td>
                    <span className="adm-table-primary-text">{enq.customer_name}</span>
                    {enq.company_name && <span className="adm-table-subtext">{enq.company_name}</span>}
                  </td>
                  <td>
                    <span style={{ fontWeight: '600' }}>{enq.product_name || 'General Inquiry'}</span>
                    <span className="adm-table-subtext">Qty: {enq.quantity || '1'}</span>
                  </td>
                  <td>
                    <a href={`tel:${enq.mobile}`} style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                      {enq.mobile}
                    </a>
                    {enq.email && <span className="adm-table-subtext">{enq.email}</span>}
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge-${enq.status.toLowerCase().replace(/\s+/g, '')}`}>
                      {enq.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {enq.assigned_name || 'Admin'}
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(enq.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <a
                        href={`https://wa.me/${enq.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${enq.customer_name}, regarding your quotation request (${enq.reference_no}) with Lakshmi Agency Chennai...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-btn-whatsapp"
                      >
                        <MessageSquare size={13} /> Chat
                      </a>
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="adm-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <Eye size={13} /> Details
                      </button>
                      <button
                        onClick={() => handleDelete(enq.id)}
                        className="adm-btn-secondary"
                        style={{ padding: '6px 8px', color: '#ef4444' }}
                        title="Delete record"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No matching enquiries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENQUIRY DETAIL / QUOTATION MODAL */}
      {selectedEnquiry && (
        <EnquiryDetailModal
          enquiry={selectedEnquiry}
          onClose={() => setSelectedEnquiry(null)}
          onUpdated={() => {
            loadEnquiries();
            setSelectedEnquiry(null);
          }}
          addToast={addToast}
        />
      )}

      {/* NEW WALK-IN ENQUIRY MODAL */}
      {showNewModal && (
        <NewOfflineEnquiryModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            loadEnquiries();
            setShowNewModal(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

/* MODAL: ENQUIRY DETAILS & QUOTE GENERATOR */
function EnquiryDetailModal({ enquiry, onClose, onUpdated, addToast }) {
  const [status, setStatus] = useState(enquiry.status);
  const [newNote, setNewNote] = useState('');
  const [showQuoteSlip, setShowQuoteSlip] = useState(false);
  const [quotePrice, setQuotePrice] = useState('24500');
  const [gstPercent, setGstPercent] = useState('18');
  const [saving, setSaving] = useState(false);

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await adminService.updateEnquiry(enquiry.id, {
        status,
        note: newNote.trim() || undefined
      });
      addToast('Enquiry record updated', 'success');
      onUpdated();
    } catch {
      addToast('Failed to update enquiry', 'error');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    const base = Number(quotePrice) || 0;
    const gst = base * (Number(gstPercent) || 0) / 100;
    return base + gst;
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal adm-modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <div>
            <h3>Quotation Request · {enquiry.reference_no}</h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Received on {new Date(enquiry.created_at).toLocaleString('en-IN')}
            </span>
          </div>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
          {/* TOP CONTACT & ACTIONS */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '15px', color: '#0f172a' }}>
                {enquiry.customer_name} {enquiry.company_name ? `(${enquiry.company_name})` : ''}
              </h4>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '16px' }}>
                <span>📞 {enquiry.mobile}</span>
                {enquiry.email && <span>✉️ {enquiry.email}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={`https://wa.me/${enquiry.mobile.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello ${enquiry.customer_name}, greetings from Lakshmi Agency Chennai. Regarding your quotation request (${enquiry.reference_no}) for ${enquiry.product_name}...`)}`}
                target="_blank"
                rel="noreferrer"
                className="adm-btn-whatsapp"
              >
                <MessageSquare size={14} /> Send WhatsApp Message
              </a>
              <a href={`tel:${enquiry.mobile}`} className="adm-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>
                <Phone size={14} /> Call
              </a>
              <button
                type="button"
                onClick={() => setShowQuoteSlip(!showQuoteSlip)}
                className="adm-btn-secondary"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <Printer size={14} /> {showQuoteSlip ? 'Hide Quote Slip' : 'Printable Quote Slip'}
              </button>
            </div>
          </div>

          {/* QUOTE SLIP PREVIEW */}
          {showQuoteSlip && (
            <div className="adm-quote-sheet" id="quote-printable">
              <div className="adm-quote-sheet-head">
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>LAKSHMI AGENCY</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
                    Old No: 99, New No: 203, Angappa Naicken Street, Parrys, Chennai – 600001<br />
                    Phone: 80127 72734 / 97872 12722 · GSTIN: 33CYHPS0640F1ZM
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b style={{ color: '#fa4729', fontSize: '14px' }}>ESTIMATE / QUOTATION</b>
                  <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: '700' }}>Ref: {enquiry.reference_no}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Date: {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div className="adm-quote-sheet-meta">
                <div>
                  <b style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Customer Details:</b>
                  <div style={{ fontSize: '13px', fontWeight: '700', marginTop: '4px' }}>{enquiry.customer_name}</div>
                  {enquiry.company_name && <div style={{ fontSize: '11px' }}>{enquiry.company_name}</div>}
                  <div style={{ fontSize: '11px' }}>Phone: {enquiry.mobile}</div>
                </div>
                <div>
                  <b style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Quotation Parameters:</b>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <label style={{ fontSize: '11px' }}>Base Price (₹):</label>
                    <input
                      type="number"
                      value={quotePrice}
                      onChange={e => setQuotePrice(e.target.value)}
                      style={{ width: '90px', padding: '2px 6px', fontSize: '11px' }}
                    />
                    <label style={{ fontSize: '11px' }}>GST %:</label>
                    <input
                      type="number"
                      value={gstPercent}
                      onChange={e => setGstPercent(e.target.value)}
                      style={{ width: '50px', padding: '2px 6px', fontSize: '11px' }}
                    />
                  </div>
                </div>
              </div>

              <table className="adm-table" style={{ border: '1px solid #cbd5e1', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <b>{enquiry.product_name}</b>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{enquiry.specifications || 'Standard manufacturer specifications'}</div>
                    </td>
                    <td>{enquiry.quantity || '1'}</td>
                    <td>₹{Number(quotePrice).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{Number(quotePrice).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: '600' }}>GST ({gstPercent}%):</td>
                    <td style={{ textAlign: 'right' }}>₹{(Number(quotePrice) * Number(gstPercent) / 100).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: '800', fontSize: '13px' }}>
                    <td colSpan="3" style={{ textAlign: 'right' }}>TOTAL AMOUNT:</td>
                    <td style={{ textAlign: 'right', color: '#0f172a' }}>₹{calculateTotal().toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small style={{ color: '#64748b', fontSize: '10px' }}>
                  Terms: Delivery from Parrys Showroom. 100% advance or against delivery. Warranty as per manufacturer terms.
                </small>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="adm-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                >
                  <Printer size={13} /> Print Quotation Slip
                </button>
              </div>
            </div>
          )}

          {/* REQUIREMENT DETAILS */}
          <div className="adm-form-grid" style={{ marginBottom: '20px' }}>
            <div>
              <label className="adm-label">Requested Product</label>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>
                {enquiry.product_name || 'General Inquiry'}
              </div>
            </div>

            <div>
              <label className="adm-label">Quantity & Preference</label>
              <div style={{ fontSize: '12px' }}>
                Qty: <b>{enquiry.quantity || '1'}</b> · Brand: <b>{enquiry.brand_preference || 'Any Brand'}</b>
              </div>
            </div>

            <div className="adm-form-full">
              <label className="adm-label">Customer Technical Notes / Requirements</label>
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#334155',
                whiteSpace: 'pre-wrap'
              }}>
                {enquiry.specifications || enquiry.message || 'No additional technical requirements specified.'}
              </div>
            </div>
          </div>

          {/* STATUS CHANGER */}
          <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700' }}>Update Quotation Status</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="adm-select"
                style={{ width: 'auto', minWidth: '180px' }}
              >
                {['New', 'Contacted', 'Quotation Sent', 'Follow-up', 'Converted', 'Closed'].map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Marking as "Converted" logs this deal as successful.
              </span>
            </div>
          </div>

          {/* INTERNAL NOTES THREAD */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700' }}>Internal Team Notes & History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {(enquiry.notes || []).map(n => (
                <div key={n.id} style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '11px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                    <b style={{ color: '#0f172a' }}>{n.admin_name}</b>
                    <span>{new Date(n.created_at).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ color: '#334155' }}>{n.note}</div>
                </div>
              ))}
              {(!enquiry.notes || enquiry.notes.length === 0) && (
                <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                  No internal notes recorded yet.
                </div>
              )}
            </div>

            <div>
              <label className="adm-label">Add New Internal Follow-up Note</label>
              <textarea
                rows="2"
                className="adm-textarea"
                placeholder="e.g. Spoke to customer, promised delivery by Tuesday. Offered 3% discount on cash payment."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="adm-modal-footer">
          <button type="button" onClick={onClose} className="adm-btn-secondary">Close</button>
          <button type="button" disabled={saving} onClick={handleSaveStatus} className="adm-btn-primary">
            {saving ? 'Saving...' : 'Save Updates'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* MODAL: LOG NEW OFFLINE ENQUIRY (WALK-IN / PHONE CALL) */
function NewOfflineEnquiryModal({ onClose, onCreated, addToast }) {
  const [form, setForm] = useState({
    customer_name: '',
    company_name: '',
    mobile: '',
    email: '',
    product_name: 'Submersible Pump',
    category_name: 'Pumps',
    brand_preference: 'CRI Pumps',
    quantity: '1',
    specifications: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.mobile) {
      addToast('Customer name and mobile number are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await adminService.createOfflineEnquiry(form);
      addToast('Walk-in enquiry logged successfully', 'success');
      onCreated();
    } catch {
      addToast('Failed to log enquiry', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>Log Walk-in / Phone Call Enquiry</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div>
                <label className="adm-label">Customer Name <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="e.g. M. Murugan"
                  value={form.customer_name}
                  onChange={e => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Company / Factory Name</label>
                <input
                  className="adm-input"
                  placeholder="e.g. Sri Balaji Engineering"
                  value={form.company_name}
                  onChange={e => setForm({ ...form, company_name: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Mobile Contact <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="+91 98400 12345"
                  value={form.mobile}
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Email Address</label>
                <input
                  type="email"
                  className="adm-input"
                  placeholder="customer@gmail.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Product Requirement</label>
                <input
                  className="adm-input"
                  placeholder="e.g. 5HP Crompton Induction Motor"
                  value={form.product_name}
                  onChange={e => setForm({ ...form, product_name: e.target.value })}
                />
              </div>

              <div>
                <label className="adm-label">Quantity</label>
                <input
                  className="adm-input"
                  placeholder="e.g. 2 Units"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Technical Requirement / Note</label>
                <textarea
                  rows="2"
                  className="adm-textarea"
                  placeholder="Depth, Phase, HP, or location details..."
                  value={form.specifications}
                  onChange={e => setForm({ ...form, specifications: e.target.value })}
                />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Initial Internal Note</label>
                <input
                  className="adm-input"
                  placeholder="e.g. Customer will visit Parrys showroom tomorrow."
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Register Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 3: PRODUCT INVENTORY MANAGER
   ========================================================================== */
function ProductManagerView({ addToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [editingProduct, setEditingProduct] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats, brs] = await Promise.all([
        adminService.getProducts(),
        adminService.getCategories(),
        adminService.getBrands()
      ]);
      setProducts(prods);
      setCategories(cats);
      setBrands(brs);
    } catch {
      addToast('Error loading catalogue items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory) {
      list = list.filter(p => String(p.category_id) === String(selectedCategory));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.model_number?.toLowerCase().includes(q) ||
        p.hp_rating?.toLowerCase().includes(q) ||
        p.category_name?.toLowerCase().includes(q) ||
        p.brands?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategory, search]);

  const handleToggleActive = async (p) => {
    try {
      await adminService.saveProduct({ ...p, is_active: !p.is_active }, p.id);
      addToast(`Product "${p.name}" ${!p.is_active ? 'Activated' : 'Hidden'}`, 'success');
      loadData();
    } catch {
      addToast('Failed to toggle status', 'error');
    }
  };

  const handleToggleFeatured = async (p) => {
    try {
      await adminService.saveProduct({ ...p, is_featured: !p.is_featured }, p.id);
      addToast(`Featured status toggled for "${p.name}"`, 'success');
      loadData();
    } catch {
      addToast('Failed to update product', 'error');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to delete / archive "${p.name}"?`)) return;
    try {
      await adminService.deleteProduct(p.id);
      addToast(`Product "${p.name}" removed from catalogue`, 'info');
      loadData();
    } catch {
      addToast('Failed to delete product', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Product Inventory & Specifications</h1>
          <p>Add, edit, or configure technical specs, HP ratings, and images for Lakshmi Agency's catalogue.</p>
        </div>
        <div className="adm-head-actions">
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowEditor(true);
            }}
            className="adm-btn-primary"
          >
            <Plus size={16} /> Add New Product
          </button>
        </div>
      </div>

      <div className="adm-panel">
        {/* FILTER BAR */}
        <div className="adm-filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="adm-search-input">
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by name, HP, model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="adm-select"
              style={{ width: 'auto' }}
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('table')}
              className={`adm-tab-btn ${viewMode === 'table' ? 'active' : ''}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`adm-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              Cards Grid
            </button>
          </div>
        </div>

        {/* TABLE VIEW */}
        {viewMode === 'table' ? (
          <div className="adm-table-responsive">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>HP & Phase</th>
                  <th>Brands</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          <img
                            src={p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=120&q=80'}
                            alt=""
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <b style={{ color: '#0f172a', fontSize: '13px' }}>{p.name}</b>
                          <span className="adm-table-subtext">
                            {p.model_number ? `Model: ${p.model_number}` : (p.availability || 'In Stock')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '600' }}>{p.category_name}</span>
                    </td>
                    <td>
                      <span>{p.hp_rating || '—'}</span>
                      {p.phase && <span className="adm-table-subtext">{p.phase}</span>}
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: '#475569' }}>{p.brands || '—'}</span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`adm-badge ${p.is_active ? 'adm-badge-active' : 'adm-badge-inactive'}`}
                        style={{ border: 0, cursor: 'pointer' }}
                      >
                        {p.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        className={`adm-badge ${p.is_featured ? 'adm-badge-featured' : 'adm-badge-inactive'}`}
                        style={{ border: 0, cursor: 'pointer' }}
                      >
                        {p.is_featured ? '★ Featured' : 'Normal'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setShowEditor(true);
                          }}
                          className="adm-btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="adm-btn-secondary"
                          style={{ padding: '6px 8px', color: '#ef4444' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No products match your search or filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div style={{ padding: '20px' }}>
            <div className="adm-products-grid">
              {filteredProducts.map(p => (
                <div key={p.id} className="adm-product-card">
                  <div className="adm-product-card-img">
                    <img
                      src={p.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'}
                      alt={p.name}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '4px' }}>
                      {p.is_featured && <span className="adm-badge adm-badge-featured">★ Featured</span>}
                      <span className={`adm-badge ${p.is_active ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                        {p.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                  </div>

                  <div className="adm-product-card-body">
                    <span style={{ fontSize: '10px', color: '#fa4729', fontWeight: '700', textTransform: 'uppercase' }}>
                      {p.category_name}
                    </span>
                    <h3 className="adm-product-card-title">{p.name}</h3>

                    <div className="adm-product-card-specs">
                      {p.hp_rating && <span className="adm-product-spec-tag">HP: {p.hp_rating}</span>}
                      {p.phase && <span className="adm-product-spec-tag">{p.phase}</span>}
                      {p.brands && <span className="adm-product-spec-tag">Brand: {p.brands}</span>}
                    </div>

                    <div className="adm-product-card-footer">
                      <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                        {p.availability || 'In Stock'}
                      </span>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setShowEditor(true);
                          }}
                          className="adm-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '11px' }}
                        >
                          <Edit size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="adm-btn-secondary"
                          style={{ padding: '5px 8px', color: '#ef4444' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT EDITOR MODAL (EASY SPECIFICATION BUILDER - NO JSON CODING) */}
      {showEditor && (
        <ProductEditorModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            loadData();
            setShowEditor(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

/* MODAL: PRODUCT EDITOR (WITH EASY SPECS BUILDER) */
function ProductEditorModal({ product, categories, brands, onClose, onSaved, addToast }) {
  const isEditing = Boolean(product?.id);
  const [name, setName] = useState(product?.name || '');
  const [categoryId, setCategoryId] = useState(product?.category_id || (categories[0]?.id || 1));
  const [subcategoryId, setSubcategoryId] = useState(product?.subcategory_id || '');
  const [modelNumber, setModelNumber] = useState(product?.model_number || '');
  const [hpRating, setHpRating] = useState(product?.hp_rating || '');
  const [phase, setPhase] = useState(product?.phase || 'Single Phase');
  const [bodyMaterial, setBodyMaterial] = useState(product?.body_material || 'Cast Iron');
  const [applicationType, setApplicationType] = useState(product?.application_type || 'Industrial & Domestic');
  const [availability, setAvailability] = useState(product?.availability || 'Ready in Stock (Parrys Showroom)');
  const [description, setDescription] = useState(product?.description || '');
  const [selectedBrandIds, setSelectedBrandIds] = useState(product?.brandIds || []);
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? true);
  const [isActive, setIsActive] = useState(product?.is_active !== false);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0]?.image_url || '');

  // Easy Specifications List (NO JSON!)
  const [specs, setSpecs] = useState(() => {
    if (!product?.specifications) return [
      { name: 'Discharge Range', value: '40 - 120 LPM' },
      { name: 'Head Range', value: '20 - 45 Meters' }
    ];
    if (Array.isArray(product.specifications)) return product.specifications;
    try {
      return JSON.parse(product.specifications);
    } catch {
      return [];
    }
  });

  const [saving, setSaving] = useState(false);

  const currentCategory = categories.find(c => Number(c.id) === Number(categoryId));
  const availableSubcategories = currentCategory?.subcategories || [];

  const handleAddSpec = () => {
    setSpecs(prev => [...prev, { name: '', value: '' }]);
  };

  const handleUpdateSpec = (idx, field, val) => {
    setSpecs(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveSpec = (idx) => {
    setSpecs(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleBrand = (bId) => {
    setSelectedBrandIds(prev =>
      prev.includes(bId) ? prev.filter(id => id !== bId) : [...prev, bId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Please enter a product title', 'error');
      return;
    }

    setSaving(true);
    const cleanSpecs = specs.filter(s => s.name?.trim() && s.value?.trim());

    const payload = {
      name: name.trim(),
      category_id: Number(categoryId),
      subcategory_id: subcategoryId ? Number(subcategoryId) : null,
      model_number: modelNumber.trim(),
      hp_rating: hpRating.trim(),
      phase: phase.trim(),
      body_material: bodyMaterial.trim(),
      application_type: applicationType.trim(),
      availability: availability.trim(),
      description: description.trim(),
      brandIds: selectedBrandIds,
      specifications: cleanSpecs,
      is_featured: isFeatured,
      is_active: isActive,
      images: imageUrl.trim() ? [{ id: Date.now(), image_url: imageUrl.trim(), is_primary: true }] : []
    };

    try {
      await adminService.saveProduct(payload, isEditing ? product.id : null);
      addToast(isEditing ? 'Product updated successfully' : 'New product created', 'success');
      onSaved();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal adm-modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>{isEditing ? `Edit Product: ${product.name}` : 'Add New Product to Catalogue'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              {/* BASIC DETAILS */}
              <div className="adm-form-full">
                <label className="adm-label">Product Name / Title <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="e.g. CRI 4-Inch Submersible Borewell Pump 3HP"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="adm-label">Product Category <span>*</span></label>
                <select
                  className="adm-select"
                  value={categoryId}
                  onChange={e => {
                    setCategoryId(e.target.value);
                    setSubcategoryId('');
                  }}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="adm-label">Subcategory</label>
                <select
                  className="adm-select"
                  value={subcategoryId}
                  onChange={e => setSubcategoryId(e.target.value)}
                >
                  <option value="">None / General</option>
                  {availableSubcategories.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* TECHNICAL PARAMETERS */}
              <div>
                <label className="adm-label">Model Number / SKU</label>
                <input
                  className="adm-input"
                  placeholder="e.g. CRI-SB-403"
                  value={modelNumber}
                  onChange={e => setModelNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="adm-label">HP Rating / Capacity</label>
                <input
                  className="adm-input"
                  placeholder="e.g. 0.5 HP, 1.0 HP, 3.0 HP, 5.0 HP"
                  value={hpRating}
                  onChange={e => setHpRating(e.target.value)}
                />
              </div>

              <div>
                <label className="adm-label">Phase</label>
                <select
                  className="adm-select"
                  value={phase}
                  onChange={e => setPhase(e.target.value)}
                >
                  <option value="Single Phase">Single Phase (220V - 240V)</option>
                  <option value="Three Phase">Three Phase (415V)</option>
                  <option value="Available in Both">Available in Both Single & Three Phase</option>
                </select>
              </div>

              <div>
                <label className="adm-label">Body Material</label>
                <input
                  className="adm-input"
                  placeholder="e.g. Cast Iron / Stainless Steel / Gunmetal"
                  value={bodyMaterial}
                  onChange={e => setBodyMaterial(e.target.value)}
                />
              </div>

              <div>
                <label className="adm-label">Application Type</label>
                <input
                  className="adm-input"
                  placeholder="e.g. Agriculture, Deep Borewells, Domestic"
                  value={applicationType}
                  onChange={e => setApplicationType(e.target.value)}
                />
              </div>

              <div>
                <label className="adm-label">Stock Availability</label>
                <input
                  className="adm-input"
                  placeholder="e.g. Ready in Stock / Delivery in 2 Days"
                  value={availability}
                  onChange={e => setAvailability(e.target.value)}
                />
              </div>

              {/* BRANDS MULTI-SELECT */}
              <div className="adm-form-full">
                <label className="adm-label">Associated Brands (Click to select)</label>
                <div className="adm-brand-pills">
                  {brands.map(b => {
                    const selected = selectedBrandIds.includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => toggleBrand(b.id)}
                        className={`adm-brand-pill ${selected ? 'selected' : ''}`}
                      >
                        {selected ? '✓ ' : '+ '}{b.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRODUCT IMAGE UPLOADER */}
              <div className="adm-form-full">
                <ImageDeviceUploader
                  label="Product Primary Image"
                  value={imageUrl}
                  onChange={setImageUrl}
                  recommendedSize="Product photo (JPG, PNG, WebP) - Stored securely"
                  helperText="Select a product photo directly from your device storage/gallery, or paste an external image URL."
                  onToast={addToast}
                />
              </div>

              {/* DYNAMIC SPECS BUILDER */}
              <div className="adm-form-full">
                <label className="adm-label">Technical Specifications Builder (No coding needed!)</label>
                <div className="adm-specs-builder">
                  {specs.map((s, idx) => (
                    <div key={idx} className="adm-spec-row">
                      <input
                        className="adm-input"
                        placeholder="Spec Name (e.g. Discharge, Head, RPM)"
                        value={s.name}
                        onChange={e => handleUpdateSpec(idx, 'name', e.target.value)}
                      />
                      <input
                        className="adm-input"
                        placeholder="Value (e.g. 150 LPM, 45 Meters, 2880 RPM)"
                        value={s.value}
                        onChange={e => handleUpdateSpec(idx, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="adm-spec-del-btn"
                        title="Remove spec"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="adm-add-spec-btn"
                  >
                    + Add Another Specification Row
                  </button>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="adm-form-full">
                <label className="adm-label">Product Overview & Features</label>
                <textarea
                  rows="3"
                  className="adm-textarea"
                  placeholder="Detailed engineering description, winding, warranty notes..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* STATUS TOGGLES */}
              <div className="adm-form-full" style={{ display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                  />
                  Active (Visible on public catalogue)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                  />
                  Featured on Homepage
                </label>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 4: CATEGORIES & SUBCATEGORIES MANAGER
   ========================================================================== */
function CategoryManagerView({ addToast }) {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedCatForSub, setSelectedCatForSub] = useState(null);

  const loadData = async () => {
    try {
      const [cats, subs] = await Promise.all([
        adminService.getCategories(),
        adminService.getSubcategories()
      ]);
      setCategories(cats);
      setSubcategories(subs);
    } catch {
      addToast('Error loading categories', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteCategory = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"? Products inside may become uncategorized.`)) return;
    try {
      await adminService.deleteCategory(c.id);
      addToast(`Category "${c.name}" removed`, 'info');
      loadData();
    } catch {
      addToast('Failed to delete category', 'error');
    }
  };

  const handleDeleteSubcategory = async (s) => {
    if (!window.confirm(`Delete subcategory "${s.name}"?`)) return;
    try {
      await adminService.deleteSubcategory(s.id);
      addToast(`Subcategory "${s.name}" removed`, 'info');
      loadData();
    } catch {
      addToast('Failed to delete subcategory', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Product Categories & Subcategories</h1>
          <p>Organize Lakshmi Agency's catalogue hierarchy into families and application groupings.</p>
        </div>
        <div className="adm-head-actions">
          <button
            onClick={() => {
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="adm-btn-primary"
          >
            <Plus size={16} /> Add New Category
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {categories.map(cat => (
          <div key={cat.id} className="adm-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '120px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
              <img
                src={cat.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80'}
                alt={cat.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px',
                background: 'linear-gradient(to top, rgba(15,23,42,0.95), transparent)',
                color: '#fff'
              }}>
                <b style={{ fontSize: '15px' }}>{cat.name}</b>
              </div>
            </div>

            <div className="adm-panel-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px', flex: 1 }}>
                {cat.description || 'Pumps, motors, and engineering components.'}
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px 12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <b style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569' }}>
                    Subcategories ({cat.subcategories?.length || 0})
                  </b>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatForSub(cat);
                      setShowSubcategoryModal(true);
                    }}
                    style={{ background: 'transparent', border: 0, color: '#fa4729', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    + Add Sub
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(cat.subcategories || []).map(s => (
                    <span
                      key={s.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {s.name}
                      <button
                        onClick={() => handleDeleteSubcategory(s)}
                        style={{ border: 0, background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                        title="Delete subcategory"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(!cat.subcategories || cat.subcategories.length === 0) && (
                    <small style={{ color: '#94a3b8' }}>None registered</small>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`adm-badge ${cat.is_featured ? 'adm-badge-featured' : 'adm-badge-active'}`}>
                  {cat.is_featured ? '★ Featured on Homepage' : 'Active Category'}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setShowCategoryModal(true);
                    }}
                    className="adm-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                  >
                    <Edit size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="adm-btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px', color: '#ef4444' }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORY MODAL */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSaved={() => {
            loadData();
            setShowCategoryModal(false);
          }}
          addToast={addToast}
        />
      )}

      {/* SUBCATEGORY MODAL */}
      {showSubcategoryModal && (
        <SubcategoryModal
          category={selectedCatForSub}
          onClose={() => setShowSubcategoryModal(false)}
          onSaved={() => {
            loadData();
            setShowSubcategoryModal(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

function CategoryModal({ category, onClose, onSaved, addToast }) {
  const isEditing = Boolean(category?.id);
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [imageUrl, setImageUrl] = useState(category?.image_url || '');
  const [isFeatured, setIsFeatured] = useState(category?.is_featured || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminService.saveCategory({
        name: name.trim(),
        description: description.trim(),
        image_url: imageUrl.trim() || undefined,
        is_featured: isFeatured
      }, isEditing ? category.id : null);
      addToast(isEditing ? 'Category updated' : 'Category created', 'success');
      onSaved();
    } catch {
      addToast('Failed to save category', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>{isEditing ? `Edit Category: ${category.name}` : 'Create New Product Category'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div className="adm-form-full">
                <label className="adm-label">Category Name <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="e.g. Industrial Pumps"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="adm-form-full">
                <ImageDeviceUploader
                  label="Category Photo / Banner"
                  value={imageUrl}
                  onChange={setImageUrl}
                  recommendedSize="Category cover photo (JPG, PNG, WebP)"
                  helperText="Upload category thumbnail or banner from this device, or enter an image link."
                  onToast={addToast}
                />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Description</label>
                <textarea
                  rows="2"
                  className="adm-textarea"
                  placeholder="Overview of this category's offerings..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="adm-form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                  />
                  Featured on Homepage Grid
                </label>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubcategoryModal({ category, onClose, onSaved, addToast }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminService.saveSubcategory({
        name: name.trim(),
        category_id: category.id,
        description: description.trim()
      });
      addToast(`Subcategory "${name}" added to ${category.name}`, 'success');
      onSaved();
    } catch {
      addToast('Failed to save subcategory', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>Add Subcategory under "{category?.name}"</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div className="adm-form-full">
                <label className="adm-label">Subcategory Name <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="e.g. Centrifugal Monobloc"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Description (Optional)</label>
                <input
                  className="adm-input"
                  placeholder="Brief note on this subcategory"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Add Subcategory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 5: BRANDS DIRECTORY MANAGER
   ========================================================================== */
function BrandManagerView({ addToast }) {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingBrand, setEditingBrand] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    try {
      const [brs, cats] = await Promise.all([
        adminService.getBrands(),
        adminService.getCategories()
      ]);
      setBrands(brs);
      setCategories(cats);
    } catch {
      addToast('Error loading brands', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete brand "${b.name}"?`)) return;
    try {
      await adminService.deleteBrand(b.id);
      addToast(`Brand "${b.name}" deleted`, 'info');
      loadData();
    } catch {
      addToast('Failed to delete brand', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Authorized Brand Partners</h1>
          <p>Manage OEM brands (Crompton, Kirloskar, CRI, Texmo, Havells, Suguna) represented at Parrys showroom.</p>
        </div>
        <div className="adm-head-actions">
          <button
            onClick={() => {
              setEditingBrand(null);
              setShowModal(true);
            }}
            className="adm-btn-primary"
          >
            <Plus size={16} /> Add Brand Partner
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
        {brands.map(b => (
          <div key={b.id} className="adm-panel" style={{ margin: 0, padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: '#f1f5f9',
                borderRadius: '8px',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid #e2e8f0'
              }}>
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <b style={{ color: '#fa4729', fontSize: '16px' }}>{b.name.charAt(0)}</b>
                )}
              </div>

              <div>
                <b style={{ fontSize: '15px', color: '#0f172a' }}>{b.name}</b>
                <span className={`adm-badge ${b.is_active ? 'adm-badge-active' : 'adm-badge-inactive'}`} style={{ display: 'block', width: 'fit-content', marginTop: '4px' }}>
                  {b.is_active ? 'Active Partner' : 'Hidden'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 16px', flex: 1 }}>
              {b.description || 'Pumps, motors & industrial spares.'}
            </p>

            <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button
                onClick={() => {
                  setEditingBrand(b);
                  setShowModal(true);
                }}
                className="adm-btn-secondary"
                style={{ padding: '5px 10px', fontSize: '11px' }}
              >
                <Edit size={12} /> Edit
              </button>
              <button
                onClick={() => handleDelete(b)}
                className="adm-btn-secondary"
                style={{ padding: '5px 8px', color: '#ef4444' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <BrandModal
          brand={editingBrand}
          categories={categories}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadData();
            setShowModal(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

function BrandModal({ brand, categories, onClose, onSaved, addToast }) {
  const isEditing = Boolean(brand?.id);
  const [name, setName] = useState(brand?.name || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [logoUrl, setLogoUrl] = useState(brand?.logo_url || '');
  const [isActive, setIsActive] = useState(brand?.is_active !== false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await adminService.saveBrand({
        name: name.trim(),
        description: description.trim(),
        logo_url: logoUrl.trim() || undefined,
        is_active: isActive
      }, isEditing ? brand.id : null);
      addToast(isEditing ? 'Brand updated' : 'Brand added', 'success');
      onSaved();
    } catch {
      addToast('Failed to save brand', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>{isEditing ? `Edit Brand: ${brand.name}` : 'Add Brand Partner'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div className="adm-form-full">
                <label className="adm-label">Brand Name <span>*</span></label>
                <input
                  required
                  className="adm-input"
                  placeholder="e.g. Crompton Greaves"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="adm-form-full">
                <ImageDeviceUploader
                  label="Brand Logo"
                  value={logoUrl}
                  onChange={setLogoUrl}
                  aspectRatio="logo"
                  recommendedSize="400 x 200 px transparent PNG or JPG"
                  helperText="Upload official brand logo from your device, or enter an image link."
                  onToast={addToast}
                />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Description</label>
                <textarea
                  rows="2"
                  className="adm-textarea"
                  placeholder="Pumps, agricultural motors, industrial product lines..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="adm-form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                  />
                  Active Brand in Directory
                </label>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 6: CUSTOMER ACCOUNTS DIRECTORY
   ========================================================================== */
function CustomerManagerView({ addToast }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadCustomers = async () => {
    try {
      const data = await adminService.getCustomers();
      setCustomers(data);
    } catch {
      addToast('Error loading customer accounts', 'error');
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.mobile?.includes(q)
    );
  }, [customers, search]);

  const handleDeactivate = async (c) => {
    if (!window.confirm(`Deactivate customer "${c.name}"?`)) return;
    try {
      await adminService.deleteCustomer(c.id);
      addToast(`Customer account deactivated`, 'info');
      loadCustomers();
    } catch {
      addToast('Failed to deactivate customer', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Registered Customer Directory</h1>
          <p>Review customer accounts, enquiry frequency, and contact coordinates.</p>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-filter-bar">
          <div className="adm-search-input">
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by customer name, company, mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="adm-pill-count">{filtered.length} Registered Accounts</span>
        </div>

        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Customer / Company</th>
                <th>Mobile Number</th>
                <th>Email Address</th>
                <th>Quotations Submitted</th>
                <th>Registered On</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <b style={{ color: '#0f172a' }}>{c.name}</b>
                    {c.company_name && <span className="adm-table-subtext">{c.company_name}</span>}
                  </td>
                  <td>
                    <a href={`tel:${c.mobile}`} style={{ color: '#0284c7', fontWeight: '700', textDecoration: 'none' }}>
                      {c.mobile}
                    </a>
                  </td>
                  <td style={{ color: '#475569' }}>{c.email}</td>
                  <td>
                    <span className="adm-pill-count" style={{ background: '#f0fdf4', color: '#15803d' }}>
                      {c.enquiry_count || 0} Quotations
                    </span>
                  </td>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <span className={`adm-badge ${c.active !== false ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                      {c.active !== false ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <a
                        href={`https://wa.me/${c.mobile.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-btn-whatsapp"
                      >
                        <MessageSquare size={13} /> WhatsApp
                      </a>
                      <button
                        onClick={() => setEditingCustomer(c)}
                        className="adm-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                      >
                        <Edit size={12} /> Edit
                      </button>
                      {c.active !== false && (
                        <button
                          onClick={() => handleDeactivate(c)}
                          className="adm-btn-secondary"
                          style={{ padding: '5px 8px', color: '#ef4444' }}
                          title="Deactivate account"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No customer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingCustomer && (
        <CustomerEditModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={() => {
            loadCustomers();
            setEditingCustomer(null);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

function CustomerEditModal({ customer, onClose, onSaved, addToast }) {
  const [name, setName] = useState(customer.name);
  const [company, setCompany] = useState(customer.company_name || '');
  const [mobile, setMobile] = useState(customer.mobile);
  const [email, setEmail] = useState(customer.email);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.updateCustomer(customer.id, {
        name,
        company_name: company || null,
        mobile,
        email
      });
      addToast('Customer details saved', 'success');
      onSaved();
    } catch {
      addToast('Failed to update customer', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>Edit Customer: {customer.name}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div>
                <label className="adm-label">Full Name <span>*</span></label>
                <input required className="adm-input" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Company Name</label>
                <input className="adm-input" value={company} onChange={e => setCompany(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Mobile Phone <span>*</span></label>
                <input required className="adm-input" value={mobile} onChange={e => setMobile(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Email Address <span>*</span></label>
                <input required type="email" className="adm-input" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 7: HOMEPAGE BANNERS
   ========================================================================== */
function BannerManagerView({ addToast }) {
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadBanners = async () => {
    try {
      const data = await adminService.getBanners();
      setBanners(data);
    } catch {
      addToast('Error loading banners', 'error');
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    try {
      await adminService.deleteBanner(b.id);
      addToast('Banner removed', 'info');
      loadBanners();
    } catch {
      addToast('Failed to delete banner', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Homepage Hero Promotional Banners</h1>
          <p>Highlight seasonal offers, agricultural pump schemes, and major industrial distributor notices.</p>
        </div>
        <div className="adm-head-actions">
          <button
            onClick={() => {
              setEditingBanner(null);
              setShowModal(true);
            }}
            className="adm-btn-primary"
          >
            <Plus size={16} /> Add Promotional Banner
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {banners.map(b => (
          <div key={b.id} className="adm-panel" style={{ margin: 0, overflow: 'hidden' }}>
            <div style={{ height: '180px', position: 'relative', background: '#0f172a' }}>
              <img
                src={b.image_url || 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=800&q=80'}
                alt={b.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(15,23,42,0.9), transparent)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                color: '#fff'
              }}>
                <span className={`adm-badge ${b.is_active ? 'adm-badge-active' : 'adm-badge-inactive'}`} style={{ width: 'fit-content', marginBottom: '6px' }}>
                  {b.is_active ? 'Live Banner' : 'Draft / Inactive'}
                </span>
                <h3 style={{ margin: '0 0 4px', fontSize: '15px', color: '#fff' }}>{b.title}</h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>{b.subtitle}</p>
              </div>
            </div>

            <div className="adm-panel-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                CTA: <b>{b.cta_label || 'Explore'}</b> → <code>{b.cta_url || '/products'}</code>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => {
                    setEditingBanner(b);
                    setShowModal(true);
                  }}
                  className="adm-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  <Edit size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="adm-btn-secondary"
                  style={{ padding: '6px 10px', color: '#ef4444' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <BannerModal
          banner={editingBanner}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadBanners();
            setShowModal(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

function BannerModal({ banner, onClose, onSaved, addToast }) {
  const isEditing = Boolean(banner?.id);
  const [title, setTitle] = useState(banner?.title || '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle || '');
  const [imageUrl, setImageUrl] = useState(banner?.image_url || '');
  const [ctaLabel, setCtaLabel] = useState(banner?.cta_label || 'Explore Products');
  const [ctaUrl, setCtaUrl] = useState(banner?.cta_url || '/products');
  const [isActive, setIsActive] = useState(banner?.is_active !== false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveBanner({
        title,
        subtitle,
        image_url: imageUrl,
        cta_label: ctaLabel,
        cta_url: ctaUrl,
        is_active: isActive
      }, isEditing ? banner.id : null);
      addToast(isEditing ? 'Banner updated' : 'Banner created', 'success');
      onSaved();
    } catch {
      addToast('Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>{isEditing ? 'Edit Promotional Banner' : 'Create Homepage Banner'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div className="adm-form-full">
                <label className="adm-label">Banner Headline <span>*</span></label>
                <input required className="adm-input" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Subheading</label>
                <input className="adm-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
              </div>

              <div className="adm-form-full">
                <ImageDeviceUploader
                  label="Promotional Banner Background Image"
                  value={imageUrl}
                  onChange={setImageUrl}
                  aspectRatio="banner"
                  recommendedSize="1920 x 700 px (Landscape Banner)"
                  helperText="Upload banner image from phone/computer, or enter an image link."
                  onToast={addToast}
                />
              </div>

              <div>
                <label className="adm-label">Button Label</label>
                <input className="adm-input" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Button Destination URL</label>
                <input className="adm-input" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} />
              </div>

              <div className="adm-form-full">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                  Active on Homepage
                </label>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 8: CATALOGUE MATRIX SPREADSHEET REVIEW
   ========================================================================== */
function CatalogueReviewView({ addToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await adminService.getCatalogueReview();
      setRows(data);
    } catch {
      addToast('Error loading review rows', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const handleResolve = async (id) => {
    try {
      await adminService.resolveCatalogueReview(id, true);
      addToast(`Row ${id} marked reviewed`, 'success');
      loadRows();
    } catch {
      addToast('Failed to update row', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Catalogue Spreadsheet Matrix Review</h1>
          <p>Audit and map source rows imported from the Excel catalogue.</p>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <h2>
            <FileSpreadsheet size={18} color="#fa4729" /> Flagged Workbook Rows
            <span className="adm-pill-count">{rows.length} Items</span>
          </h2>
        </div>

        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Row #</th>
                <th>Product Name / Mapping</th>
                <th>Reason for Flag</th>
                <th>Source Cells</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td><b>Row {r.row_number}</b></td>
                  <td>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>
                      {r.product_name || 'Spreadsheet Matrix Header'}
                    </span>
                  </td>
                  <td>
                    <span className="adm-badge adm-badge-review">{r.review_reason}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: '10px', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                      {JSON.stringify(r.source_data)}
                    </code>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleResolve(r.id)}
                      className="adm-btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '11px' }}
                    >
                      <CheckCircle2 size={13} color="#10b981" /> Mark Reviewed
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    All workbook rows have been reviewed and verified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 9: WEBSITE SETTINGS & BANK DETAILS
   ========================================================================== */
function WebsiteSettingsView({ addToast }) {
  const [settings, setSettings] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getSettings().then(data => {
      const flattened = {};
      for (const [k, v] of Object.entries(data)) {
        flattened[k] = v?.value || '';
      }
      setSettings(flattened);
    });
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveSettings(settings);
      addToast('Business settings and banking information saved successfully', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Business Profile & Banking Information</h1>
          <p>Official contact details for invoices, quotations, and secure internal bank accounts.</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {/* STORE DETAILS */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2><Building size={18} color="#fa4729" /> Official Business & Showroom Info</h2>
          </div>
          <div className="adm-panel-body">
            <div className="adm-form-grid">
              <div className="adm-form-full">
                <ImageDeviceUploader
                  label="Official Store Logo (For quotes, header & invoices)"
                  value={settings.logo_url || ''}
                  onChange={val => handleChange('logo_url', val)}
                  aspectRatio="logo"
                  recommendedSize="Store logo (PNG, JPG, WebP)"
                  helperText="Upload official company logo from this device to appear on customer quotations and portal."
                  onToast={addToast}
                />
              </div>

              <div>
                <label className="adm-label">Store Legal Name</label>
                <input className="adm-input" value={settings.business_name || ''} onChange={e => handleChange('business_name', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">GSTIN / Tax Identification</label>
                <input className="adm-input" value={settings.gst_number || ''} onChange={e => handleChange('gst_number', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Contact Phone Numbers (Comma separated)</label>
                <input className="adm-input" value={settings.phones || ''} onChange={e => handleChange('phones', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">WhatsApp Number (International format)</label>
                <input className="adm-input" value={settings.whatsapp_number || ''} onChange={e => handleChange('whatsapp_number', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Official Store Email</label>
                <input className="adm-input" value={settings.email || ''} onChange={e => handleChange('email', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Google Maps Search Query / Link</label>
                <input className="adm-input" value={settings.google_maps_query || ''} onChange={e => handleChange('google_maps_query', e.target.value)} />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">Showroom Address (Parrys, Chennai)</label>
                <textarea rows="2" className="adm-textarea" value={settings.address || ''} onChange={e => handleChange('address', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* BANKING DETAILS (ADMIN ONLY) */}
        <div className="adm-panel">
          <div className="adm-panel-header">
            <h2><Lock size={18} color="#fa4729" /> Banking & RTGS / NEFT / UPI Details (Admin Only)</h2>
          </div>
          <div className="adm-panel-body">
            <div className="adm-form-grid">
              <div>
                <label className="adm-label">Bank Name</label>
                <input className="adm-input" value={settings.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Bank Account Number</label>
                <input className="adm-input" value={settings.bank_account || ''} onChange={e => handleChange('bank_account', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Bank IFSC Code</label>
                <input className="adm-input" value={settings.bank_ifsc || ''} onChange={e => handleChange('bank_ifsc', e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Branch Location</label>
                <input className="adm-input" value={settings.bank_branch || ''} onChange={e => handleChange('bank_branch', e.target.value)} />
              </div>

              <div className="adm-form-full">
                <label className="adm-label">UPI ID for Advance Payments</label>
                <input className="adm-input" value={settings.upi_id || ''} onChange={e => handleChange('upi_id', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="submit" disabled={saving} className="adm-btn-primary" style={{ padding: '12px 24px', fontSize: '13px' }}>
            {saving ? 'Saving Settings...' : 'Save All Business Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ==========================================================================
   VIEW 10: PAGE CONTENT & SEO CMS
   ========================================================================== */
function ContentManagerView({ addToast }) {
  const [pages, setPages] = useState([]);
  const [activeKey, setActiveKey] = useState('home');
  const [form, setForm] = useState({ title: '', body: '', meta_title: '', meta_description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getContent().then(data => {
      setPages(data);
      const cur = data.find(p => p.page_key === activeKey);
      if (cur) setForm(cur);
    });
  }, [activeKey]);

  const handleSelectKey = (key) => {
    setActiveKey(key);
    const cur = pages.find(p => p.page_key === key);
    if (cur) setForm(cur);
    else setForm({ title: '', body: '', meta_title: '', meta_description: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveContent(activeKey, form);
      addToast(`Page content for "${activeKey}" saved`, 'success');
    } catch {
      addToast('Failed to save page content', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Public Page Copy & SEO Metadata</h1>
          <p>Customize headings, introductory copy, and Google search snippets for public pages.</p>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-panel-header">
          <div className="adm-tabs">
            {['home', 'about', 'services', 'contact'].map(k => (
              <button
                key={k}
                onClick={() => handleSelectKey(k)}
                className={`adm-tab-btn ${activeKey === k ? 'active' : ''}`}
                style={{ textTransform: 'capitalize' }}
              >
                {k} Page
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="adm-panel-body">
          <div className="adm-form-grid">
            <div className="adm-form-full">
              <label className="adm-label">Page Main Heading</label>
              <input
                className="adm-input"
                value={form.title || ''}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="adm-form-full">
              <label className="adm-label">Body Content / Introduction</label>
              <textarea
                rows="6"
                className="adm-textarea"
                value={form.body || ''}
                onChange={e => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div>
              <label className="adm-label">Google SEO Title</label>
              <input
                className="adm-input"
                value={form.meta_title || ''}
                onChange={e => setForm({ ...form, meta_title: e.target.value })}
              />
            </div>

            <div>
              <label className="adm-label">Google SEO Meta Description</label>
              <input
                className="adm-input"
                value={form.meta_description || ''}
                onChange={e => setForm({ ...form, meta_description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Page Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 11: AUDIT ACTIVITY LOGS
   ========================================================================== */
function ActivityLogView({ addToast }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminService.getActivity().then(data => setLogs(data));
  }, []);

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Admin Audit Trail & Activity History</h1>
          <p>Chronological log of changes made by administrators, product updates, and quotations handled.</p>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action Type</th>
                <th>Target Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(l.created_at).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <b style={{ color: '#0f172a' }}>{l.admin_name || 'Admin'}</b>
                  </td>
                  <td>
                    <span className="adm-badge adm-badge-new" style={{ textTransform: 'capitalize' }}>
                      {l.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#0284c7' }}>
                      {l.entity_type} #{l.entity_id || '—'}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '10px', background: '#f8fafc', padding: '3px 6px', borderRadius: '4px' }}>
                      {typeof l.details === 'string' ? l.details : JSON.stringify(l.details)}
                    </code>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No activity logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   VIEW 12: ADMIN STAFF & TEAM ROLES
   ========================================================================== */
function TeamManagerView({ addToast }) {
  const [team, setTeam] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const loadTeam = async () => {
    try {
      const data = await adminService.getTeam();
      setTeam(data);
    } catch {
      addToast('Error loading team members', 'error');
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate access for "${member.name}"?`)) return;
    try {
      await adminService.deleteTeamMember(member.id);
      addToast(`Admin ${member.name} deactivated`, 'info');
      loadTeam();
    } catch {
      addToast('Failed to deactivate member', 'error');
    }
  };

  return (
    <div>
      <div className="adm-page-head">
        <div>
          <h1>Admin Team & Access Permissions</h1>
          <p>Control who has access to the workspace (Owner, Manager, Editor).</p>
        </div>
        <div className="adm-head-actions">
          <button
            onClick={() => {
              setEditingAdmin(null);
              setShowModal(true);
            }}
            className="adm-btn-primary"
          >
            <Plus size={16} /> Add Team Member
          </button>
        </div>
      </div>

      <div className="adm-panel">
        <div className="adm-table-responsive">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Email Address</th>
                <th>Permission Role</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map(m => (
                <tr key={m.id}>
                  <td>
                    <b style={{ color: '#0f172a' }}>{m.name}</b>
                  </td>
                  <td style={{ color: '#475569' }}>{m.email}</td>
                  <td>
                    <span className="adm-badge adm-badge-contacted" style={{ textTransform: 'uppercase' }}>
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge ${m.active ? 'adm-badge-active' : 'adm-badge-inactive'}`}>
                      {m.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setEditingAdmin(m);
                          setShowModal(true);
                        }}
                        className="adm-btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '11px' }}
                      >
                        <Edit size={12} /> Edit
                      </button>
                      {m.active && m.role !== 'owner' && (
                        <button
                          onClick={() => handleDeactivate(m)}
                          className="adm-btn-secondary"
                          style={{ padding: '5px 8px', color: '#ef4444' }}
                          title="Deactivate"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <TeamModal
          adminMember={editingAdmin}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadTeam();
            setShowModal(false);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}

function TeamModal({ adminMember, onClose, onSaved, addToast }) {
  const isEditing = Boolean(adminMember?.id);
  const [name, setName] = useState(adminMember?.name || '');
  const [email, setEmail] = useState(adminMember?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(adminMember?.role || 'editor');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.saveTeamMember({
        name,
        email,
        password: password || undefined,
        role
      }, isEditing ? adminMember.id : null);
      addToast(isEditing ? 'Admin updated' : 'Admin created', 'success');
      onSaved();
    } catch {
      addToast('Failed to save team member', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="adm-modal-header" style={{ flexShrink: 0 }}>
          <h3>{isEditing ? `Edit Admin: ${adminMember.name}` : 'Add New Admin Staff'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          <div className="adm-modal-body" style={{ overflowY: 'auto', flex: '1 1 auto', minHeight: 0, maxHeight: 'calc(88vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
            <div className="adm-form-grid">
              <div>
                <label className="adm-label">Full Name <span>*</span></label>
                <input required className="adm-input" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div>
                <label className="adm-label">Email Address <span>*</span></label>
                <input required type="email" className="adm-input" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              {!isEditing && (
                <div>
                  <label className="adm-label">Initial Password <span>*</span></label>
                  <input required minLength="8" type="password" className="adm-input" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              )}

              <div>
                <label className="adm-label">Workspace Role</label>
                <select className="adm-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="editor">Editor (Catalogue & Enquiries View)</option>
                  <option value="manager">Manager (Full Product & Quotation Control)</option>
                  <option value="owner">Owner (Full Store & Financial Control)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="adm-modal-footer">
            <button type="button" onClick={onClose} className="adm-btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="adm-btn-primary">
              {saving ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
