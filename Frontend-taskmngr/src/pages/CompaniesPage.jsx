

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { companyApi } from '../api/apiService';
import { useNotification } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import './Companies.css';

function CompaniesPage() {
    const { accessToken, currentUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const isAdmin = currentUser?.role === "admin";

    const fetchCompanies = useCallback(async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const fetchedCompanies = await companyApi.getAll(accessToken);
            setCompanies(fetchedCompanies);
        } catch (err) {
            showNotification(err.message || t('failed_to_fetch_companies'), 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        if (accessToken) {
            fetchCompanies();
        } else {
            setLoading(false);
        }
    }, [accessToken, fetchCompanies]);

    const handleCompanyClick = (companyId) => {
        navigate(`/companies/${companyId}`);
    };

    const handleDeleteCompany = async (companyId, companyName) => {
        if (!window.confirm(t('confirm_delete_company', { name: companyName }))) return;
        try {
            await companyApi.delete(companyId, accessToken);
            showNotification(t('company_deleted_success'), 'success');
            fetchCompanies();
        } catch (err) {
            showNotification(err.message || t('failed_to_delete_company'), 'error');
        }
    };

    if (loading) {
        return <div className="loading-spinner">{t('loading')}</div>;
    }

    return (
        <div className="companies-container">
            <div className="companies-header">
                <h1>{t('company_management')}</h1>
                {isAdmin && (
                    <button onClick={() => navigate('/companies/new')} className="add-company-button">
                        {t('new_company')}
                    </button>
                )}
            </div>

            <div className="companies-grid">
                {companies.length === 0 ? (
                    <div className="no-companies">
                        <h3>{t('no_companies_registered')}</h3>
                        {isAdmin && <p>{t('add_new_company_cta')}</p>}
                    </div>
                ) : (
                    companies.map(company => (
                        <div key={company.id} className="company-card" onClick={() => handleCompanyClick(company.id)}>
                            <div className="company-card-header">
                                <h3>{company.name}</h3>
                                {isAdmin && (
                                    <div className="company-actions">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/companies/edit/${company.id}`);
                                            }}
                                            className="edit-button"
                                        >
                                            {t('edit')}
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCompany(company.id, company.name);
                                            }}
                                            className="delete-button"
                                        >
                                            {t('delete')}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="company-card-content">
                                <div className="company-details">
                                    {company.vat_number && <p><strong>{t('vat_number')}:</strong> {company.vat_number}</p>}
                                    {company.occupation && <p><strong>{t('occupation')}:</strong> {company.occupation}</p>}
                                    {company.creation_date && (
                                        <p><strong>{t('created')}:</strong> {new Date(company.creation_date).toLocaleDateString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default CompaniesPage;