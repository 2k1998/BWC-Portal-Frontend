import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext(null);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState('en');

    useEffect(() => {
        const savedLangData = localStorage.getItem('languagePreference');
        if (savedLangData) {
            const { lang, expiry } = JSON.parse(savedLangData);
            if (new Date().getTime() < expiry) {
                setLanguageState(lang);
            } else {
                localStorage.removeItem('languagePreference');
            }
        }
    }, []);

    const setLanguage = useCallback((lang) => {
        const now = new Date();
        const expiry = now.getTime() + (30 * 24 * 60 * 60 * 1000);
        const langData = { lang, expiry };
        
        localStorage.setItem('languagePreference', JSON.stringify(langData));
        setLanguageState(lang);
    }, []);

    // --- THIS IS THE UPGRADED 't' FUNCTION ---
    const t = useCallback((key, replacements = {}) => {
        let translation = translations[language][key] || key;

        // Loop through the replacements and replace placeholders
        Object.keys(replacements).forEach(placeholder => {
            const regex = new RegExp(`{{${placeholder}}}`, 'g');
            translation = translation.replace(regex, replacements[placeholder]);
        });

        return translation;
    }, [language]);
    // --- END OF UPGRADE ---

    const getTranslation = useCallback((key) => {
        return translations[language]?.[key] || key;
    }, [language]);

    const value = {
        language,
        setLanguage,
        t, // Provide the upgraded translation function
        getTranslation,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};