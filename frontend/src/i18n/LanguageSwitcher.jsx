import { useEffect, useState } from 'react';
import { getLanguage, setLanguage, subscribe } from './core.js';

export function LanguageSwitcher({ mobile = false }) {
  const [language, setCurrent] = useState(getLanguage());
  useEffect(() => subscribe(setCurrent), []);

  return (
    <div className={`lang-switch${mobile ? ' lang-switch--mobile' : ''}`} role="group" aria-label="Language">
      <button type="button" aria-label="English" aria-pressed={language === 'en'} className={language === 'en' ? 'is-active' : ''} onClick={() => setLanguage('en')}>EN</button>
      <span aria-hidden="true">/</span>
      <button type="button" aria-label="Tamil" aria-pressed={language === 'ta'} className={language === 'ta' ? 'is-active' : ''} onClick={() => setLanguage('ta')}>தமிழ்</button>
    </div>
  );
}
