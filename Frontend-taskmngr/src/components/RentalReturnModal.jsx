// src/components/RentalReturnModal.jsx
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './Modal.css'; // Reuse general modal styles

function RentalReturnModal({ isOpen, onClose, onConfirm, rental }) {
    const { t } = useLanguage();
    const [endKilometers, setEndKilometers] = useState('');
    const [gasTankEnd, setGasTankEnd] = useState('Full');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!endKilometers || parseInt(endKilometers) < rental.start_kilometers) {
            alert('End kilometers must be a number and greater than or equal to start kilometers.');
            return;
        }
        onConfirm({
            end_kilometers: parseInt(endKilometers),
            gas_tank_end: gasTankEnd,
        });
    };

    const gasOptions = ["Empty", "1/4", "1/2", "3/4", "Full"];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Finalize Car Return</h3>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Enter the final details for the rental to <strong>{rental.customer_name} {rental.customer_surname}</strong>.</p>
                    <div className="form-group" style={{ textAlign: 'left', marginTop: '20px' }}>
                        <label htmlFor="endKilometers">End Kilometers (must be ≥ {rental.start_kilometers})</label>
                        <input
                            type="number"
                            id="endKilometers"
                            value={endKilometers}
                            onChange={(e) => setEndKilometers(e.target.value)}
                            min={rental.start_kilometers}
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left', marginTop: '15px' }}>
                        <label htmlFor="gasTankEnd">Gas Tank Level on Return</label>
                        <select
                            id="gasTankEnd"
                            value={gasTankEnd}
                            onChange={(e) => setGasTankEnd(e.target.value)}
                            required
                            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                        >
                            {gasOptions.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="modal-cancel-button" onClick={onClose}>Cancel</button>
                    <button className="modal-confirm-button" onClick={handleSubmit}>Save and Lock</button>
                </div>
            </div>
        </div>
    );
}

export default RentalReturnModal;
