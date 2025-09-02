// src/pages/NewCompanyPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { companyApi } from '../api/apiService';
import './Auth.css'; // Reusing styles

function NewCompanyPage() {
    const [companyName, setCompanyName] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [occupation, setOccupation] = useState('');
    const [creationDate, setCreationDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { accessToken } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const companyData = {
            name: companyName,
            vat_number: vatNumber || null,
            occupation,
            creation_date: creationDate,
            description
        };

        try {
            await companyApi.create(companyData, accessToken);
            showNotification('Company registered successfully!', 'success');
            navigate('/companies');
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('register_new_company')}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="companyName">{t('company_name')}</label>
                    <input 
                        id="companyName" 
                        type="text" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="vatNumber">{t('vat_number')}</label>
                    <input 
                        id="vatNumber" 
                        type="text" 
                        value={vatNumber} 
                        onChange={(e) => setVatNumber(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="occupation">{t('occupation')}</label>
                    <input 
                        id="occupation" 
                        type="text" 
                        value={occupation} 
                        onChange={(e) => setOccupation(e.target.value)} 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="creationDate">{t('creation_day')}</label>
                    <input 
                        id="creationDate" 
                        type="date" 
                        value={creationDate} 
                        onChange={(e) => setCreationDate(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">{t('description')}</label>
                    <textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        rows="4" 
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? t('registering') : t('register')}
                </button>
            </form>
        </div>
    );
}

export default NewCompanyPage;