// src/components/CarMaintenanceModal.jsx
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Modal.css';

const initialFormState = {
    kteo_last_date: '',
    kteo_next_date: '',
    service_last_date: '',
    service_next_date: '',
    tires_last_change_date: '',
};

function CarMaintenanceModal({ isOpen, onClose, onConfirm, car }) {
    const { t } = useLanguage();
    const [formValues, setFormValues] = useState(initialFormState);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (car) {
            setFormValues({
                kteo_last_date: car.kteo_last_date || '',
                kteo_next_date: car.kteo_next_date || '',
                service_last_date: car.service_last_date || '',
                service_next_date: car.service_next_date || '',
                tires_last_change_date: car.tires_last_change_date || '',
            });
            setErrors({});
        }
    }, [car]);

    if (!isOpen || !car) return null;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateDates = () => {
        const nextErrors = {};
        const datePairs = [
            ['kteo_last_date', 'kteo_next_date'],
            ['service_last_date', 'service_next_date'],
        ];

        datePairs.forEach(([lastKey, nextKey]) => {
            if (formValues[lastKey] && formValues[nextKey]) {
                const lastDate = new Date(formValues[lastKey]);
                const nextDate = new Date(formValues[nextKey]);
                if (nextDate < lastDate) {
                    nextErrors[nextKey] = t('maintenance_date_error');
                }
            }
        });

        return nextErrors;
    };

    const handleSubmit = () => {
        const validationErrors = validateDates();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        onConfirm({
            kteo_last_date: formValues.kteo_last_date || null,
            kteo_next_date: formValues.kteo_next_date || null,
            service_last_date: formValues.service_last_date || null,
            service_next_date: formValues.service_next_date || null,
            tires_last_change_date: formValues.tires_last_change_date || null,
        });
    };

    return (
        <div className="app-modal-overlay">
            <div className="app-modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">{t('maintenance_modal_title')}</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body" style={{ textAlign: 'left' }}>
                    <p style={{ textAlign: 'left' }}>
                        {t('maintenance_modal_description')} <strong>{car.manufacturer} {car.model}</strong>
                    </p>
                    <div className="form-group" style={{ marginTop: '16px' }}>
                        <label htmlFor="kteo_last_date">{t('kteo_last_date')}</label>
                        <input
                            id="kteo_last_date"
                            name="kteo_last_date"
                            type="date"
                            value={formValues.kteo_last_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="kteo_next_date">{t('kteo_next_date')}</label>
                        <input
                            id="kteo_next_date"
                            name="kteo_next_date"
                            type="date"
                            value={formValues.kteo_next_date}
                            onChange={handleChange}
                        />
                        {errors.kteo_next_date && (
                            <div className="form-error">{errors.kteo_next_date}</div>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="service_last_date">{t('service_last_date')}</label>
                        <input
                            id="service_last_date"
                            name="service_last_date"
                            type="date"
                            value={formValues.service_last_date}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="service_next_date">{t('service_next_date')}</label>
                        <input
                            id="service_next_date"
                            name="service_next_date"
                            type="date"
                            value={formValues.service_next_date}
                            onChange={handleChange}
                        />
                        {errors.service_next_date && (
                            <div className="form-error">{errors.service_next_date}</div>
                        )}
                    </div>
                    <div className="form-group">
                        <label htmlFor="tires_last_change_date">{t('tires_last_change_date')}</label>
                        <input
                            id="tires_last_change_date"
                            name="tires_last_change_date"
                            type="date"
                            value={formValues.tires_last_change_date}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-button" onClick={onClose}>{t('cancel')}</button>
                    <button className="modal-confirm-button" onClick={handleSubmit}>{t('save_maintenance')}</button>
                </div>
            </div>
        </div>
    );
}

export default CarMaintenanceModal;
