import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ContactForm = ({ contact, onSubmit, onCancel }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company: '',
        job_title: '',
        notes: ''
    });

    useEffect(() => {
        if (contact) {
            setFormData(contact);
        }
    }, [contact]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{contact ? t('update_contact') : t('add_new_contact')}</h2>
                    <button className="close-button" onClick={onCancel}>×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="contact-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('first_name')}:</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>{t('last_name')}:</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('email')}:</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>{t('phone_number')}:</label>
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>{t('company')}:</label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>{t('job_title')}:</label>
                            <input
                                type="text"
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label>{t('notes')}:</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button type="button" onClick={onCancel} className="btn-cancel">
                            {t('cancel')}
                        </button>
                        <button type="submit" className="btn-primary">
                            {contact ? t('update_contact') : t('add_contact')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactForm; 