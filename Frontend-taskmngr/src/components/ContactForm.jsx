// frontend/Frontend-taskmngr/src/components/ContactForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Props:
 * - existingContact (preferred) OR contact (legacy)
 * - onSubmit(formData)
 * - onCancel()
 */
const ContactForm = ({ existingContact, contact, onSubmit, onCancel }) => {
  const { t } = useLanguage();

  // Normalize incoming data: prefer existingContact, fall back to contact, else null
  const initialContact = useMemo(() => existingContact ?? contact ?? null, [existingContact, contact]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    company: '',
    job_title: '',
    notes: '',
  });

  // Prefill when editing
  useEffect(() => {
    if (initialContact) {
      setFormData({
        first_name: initialContact.first_name ?? '',
        last_name: initialContact.last_name ?? '',
        email: initialContact.email ?? '',
        phone_number: initialContact.phone_number ?? '',
        company: initialContact.company ?? '',
        job_title: initialContact.job_title ?? '',
        notes: initialContact.notes ?? '',
      });
    } else {
      // ensure clean slate for "add"
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        company: '',
        job_title: '',
        notes: '',
      });
    }
  }, [initialContact]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialContact ? t('edit_contact') || 'Edit Contact' : t('add_contact') || 'Add Contact'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">{t('first_name') || 'First name'}</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">{t('last_name') || 'Last name'}</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">{t('email') || 'Email'}</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">{t('phone_number') || 'Phone'}</label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="company">{t('company') || 'Company'}</label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="job_title">{t('job_title') || 'Job title'}</label>
              <input
                id="job_title"
                name="job_title"
                type="text"
                value={formData.job_title}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">{t('notes') || 'Notes'}</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              {t('cancel') || 'Cancel'}
            </button>
            <button type="submit" className="btn-primary">
              {initialContact ? t('update_contact') || 'Update' : t('add_contact') || 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm;
