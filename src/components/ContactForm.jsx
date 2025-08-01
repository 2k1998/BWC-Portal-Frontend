import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Modal.css';
// CORRECTED PATH: Go up one directory from 'components' to 'src', then down into 'pages'
import '../pages/Auth.css';

function ContactForm({ onSubmit, onCancel, existingContact }) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company: '',
        job_title: '',
        notes: '',
    });

    useEffect(() => {
        if (existingContact) {
            setFormData({
                first_name: existingContact.first_name || '',
                last_name: existingContact.last_name || '',
                email: existingContact.email || '',
                phone_number: existingContact.phone_number || '',
                company: existingContact.company || '',
                job_title: existingContact.job_title || '',
                notes: existingContact.notes || '',
            });
        }
    }, [existingContact]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{existingContact ? t('edit_contact') : t('add_new_contact')}</h3>
                    <button className="modal-close-button" onClick={onCancel}>&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label>{t('first_name')}:</label>
                            <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>{t('surname')}:</label>
                            <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('email')}:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('phone_number')}:</label>
                            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                        </div>
                         <div className="form-group">
                            <label>{t('company')}:</label>
                            <input type="text" name="company" value={formData.company} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>{t('job_title')}:</label>
                            <input type="text" name="job_title" value={formData.job_title} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>{t('notes')}:</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows="4" style={{ resize: 'vertical' }}></textarea>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onCancel} className="modal-cancel-button">{t('cancel')}</button>
                        <button type="submit" className="modal-confirm-button">{existingContact ? t('save_changes') : t('add_contact')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ContactForm;