// src/pages/EditCompanyPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../context/useAuth';
import { companyApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css'; // Reuse form styles

function EditCompanyPage() {
    const { companyId } = useParams();
    const navigate = useNavigate();
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const [companyName, setCompanyName] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [occupation, setOccupation] = useState('');
    const [creationDate, setCreationDate] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompany = async () => {
            try {
                const data = await companyApi.getById(parseInt(companyId), accessToken);
                setCompanyName(data.name);
                setVatNumber(data.vat_number || '');
                setOccupation(data.occupation || '');
                setDescription(data.description || '');
                // Format date for the date input field
                if (data.creation_date) {
                    setCreationDate(new Date(data.creation_date).toISOString().split('T')[0]);
                }
            } catch (err) {
                showNotification(err.message || 'Failed to fetch company data.', 'error');
                navigate('/companies');
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [companyId, accessToken, showNotification, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const companyData = {
            name: companyName,
            vat_number: vatNumber || null,
            occupation: occupation || null,
            creation_date: creationDate || null,
            description: description || null,
        };
        try {
            await companyApi.update(parseInt(companyId), companyData, accessToken);
            showNotification('Company updated successfully!', 'success');
            navigate('/companies');
        } catch (err) {
            showNotification(err.message || 'Failed to update company.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-spinner">Loading Company Data...</div>;
    }

    return (
        <div className="auth-container">
            <h2>Edit Company</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="companyName">{t('company_name')}</label>
                    <input id="companyName" type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="vatNumber">{t('vat_number')}</label>
                    <input id="vatNumber" type="text" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="occupation">{t('occupation')}</label>
                    <input id="occupation" type="text" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="creationDate">{t('creation_day')}</label>
                    <input id="creationDate" type="date" value={creationDate} onChange={(e) => setCreationDate(e.target.value)} />
                </div>
                <div className="form-group">
                    <label htmlFor="description">{t('description')}</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Company'}
                </button>
            </form>
        </div>
    );
}

export default EditCompanyPage;
