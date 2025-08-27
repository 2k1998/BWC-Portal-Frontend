/* eslint-disable react-refresh/only-export-components */
// src/context/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations'; // <-- use the big dictionary

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

// normalize saved legacy "gr" → "el"
const normalizeLanguage = (lang) => {
  if (!lang) return 'en';
  if (lang === 'gr') return 'el';
  return lang;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('appLanguage');
    return normalizeLanguage(saved) || 'en';
  });

  useEffect(() => {
    const normalized = normalizeLanguage(language);
    localStorage.setItem('appLanguage', normalized);
    document.documentElement.lang = normalized; // good for a11y/SEO
  }, [language]);

  // translation function with fallback + {{var}} interpolation
  const t = (key, vars = {}) => {
    const lang = normalizeLanguage(language) || 'en';
    const table = translations[lang] || {};
    let value = table[key];

    if (value === undefined) {
      // fallback to English if missing
      value = (translations.en || {})[key] ?? key;
      if (import.meta?.env?.MODE !== 'production') {
        console.warn('[i18n] Missing key:', key, 'for lang:', lang);
      }
    }

    if (typeof value === 'string') {
      value = value.replace(/{{\s*(\w+)\s*}}/g, (_, v) => (vars[v] ?? ''));
    }
    return value;
  };

  const setAppLanguage = (lang) => setLanguage(normalizeLanguage(lang));

  const value = { language: normalizeLanguage(language), setLanguage: setAppLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageContext;


