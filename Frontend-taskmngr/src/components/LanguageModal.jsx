import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageModal.css'; // We'll create this CSS file next

function LanguageModal({ isOpen, onClose }) {
    const { setLanguage } = useLanguage();

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
                    <h2>Select Your Language / Επιλέξτε τη γλώσσα σας</h2>
                </div>
                <div className="language-modal-body">
                    <button onClick={() => handleSelect('en')} className="language-button">
                        <span className="flag-icon">🇺🇸</span>
                        <span>English</span>
                    </button>
                    <button onClick={() => handleSelect('el')} className="language-button">
                        <span className="flag-icon">🇬🇷</span>
                        <span>Ελληνικά (Greek)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LanguageModal;
