export const SITE_LOGO = '/lakshmi-agency-logo.png';

export function SiteLogo({ className = '', alt = 'Lakshmi Agency logo' }) {
  return <img src={SITE_LOGO} alt={alt} className={className} />;
}

export default SiteLogo;
