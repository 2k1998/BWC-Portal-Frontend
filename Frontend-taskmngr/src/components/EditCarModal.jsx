// src/components/EditCarModal.jsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Modal.css'; // Reuse general modal styles

function EditCarModal({ isOpen, onClose, onConfirm, car }) {
    const { t } = useLanguage();
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [licensePlate, setLicensePlate] = useState('');
    const [vin, setVin] = useState('');

    // When the modal opens, pre-fill the form with the car's current data
    useEffect(() => {
        if (car) {
            setManufacturer(car.manufacturer);
            setModel(car.model);
            setLicensePlate(car.license_plate);
            setVin(car.vin);
        }
    }, [car]);

    if (!isOpen || !car) return null;

    const handleSubmit = () => {
        // Pass the updated data back to the parent component
        onConfirm({
            manufacturer,
            model,
            license_plate: licensePlate,
            vin,
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Edit Car Details</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Update the information for: <strong>{car.manufacturer} {car.model}</strong></p>
                    <div className="form-group" style={{ textAlign: 'left', marginTop: '20px' }}>
                        <label htmlFor="manufacturer">{t('manufacturer')}</label>
                        <input type="text" id="manufacturer" value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label htmlFor="model">{t('model')}</label>
                        <input type="text" id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label htmlFor="licensePlate">{t('license_plate')}</label>
                        <input type="text" id="licensePlate" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label htmlFor="vin">{t('vin')}</label>
                        <input type="text" id="vin" value={vin} onChange={(e) => setVin(e.target.value)} required />
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-button" onClick={onClose}>{t('cancel')}</button>
                    <button className="modal-confirm-button" onClick={handleSubmit}>Update Car</button>
                </div>
            </div>
        </div>
    );
}

export default EditCarModal;
