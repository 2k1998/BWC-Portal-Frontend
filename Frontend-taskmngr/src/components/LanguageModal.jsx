import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';
import './LanguageModal.css'; // We'll create this CSS file next

function LanguageModal({ isOpen, onClose }) {
    const { setLanguage, t } = useLanguage();

    if (!isOpen) {
        return null;
    }

    const handleSelect = (lang) => {
        setLanguage(lang);
        onClose(); // Close the modal after selection
    };

    return (
        <div className="modal-overlay">
            <div className="language-modal-content">
                <div className="language-modal-header">
                    <h2>{t('select_language')} / {t('select_language_greek')}</h2>
                </div>
                <div className="language-modal-body">
                    <button onClick={() => handleSelect('en')} className="language-button">
                        <Globe className="flag-icon" size={20} />
                        <span>{t('english')}</span>
                    </button>
                    <button onClick={() => handleSelect('el')} className="language-button">
                        <Globe className="flag-icon" size={20} />
                        <span>{t('greek')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LanguageModal;
