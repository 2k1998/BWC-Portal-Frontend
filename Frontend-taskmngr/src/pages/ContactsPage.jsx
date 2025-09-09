// src/pages/ContactsPage.jsx - Complete and Fixed Version
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { contactApi, dailyCallApi } from '../api/apiService';

import ContactForm from '../components/ContactForm';
import Papa from 'papaparse';
import './Contacts.css';

function ContactsPage() {
    const { accessToken } = useAuth();
    const { t } = useLanguage();
    const { showNotification } = useNotification();

    // State
    const [contacts, setContacts] = useState([]);
    const [dailyCalls, setDailyCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [isImporting, setIsImporting] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'daily'
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all data
    const fetchAllData = useCallback(async () => {
        if (!accessToken) return;
        
        setLoading(true);
        try {
            const [contactsData, dailyCallsData] = await Promise.all([
                contactApi.getAll(accessToken),
                dailyCallApi.getMyDailyCalls(accessToken)
            ]);
            setContacts(contactsData);
            setDailyCalls(dailyCallsData);
        } catch (err) {
            showNotification(err.message || t('failed_to_load_data') || 'Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    }, [accessToken, showNotification, t]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Handle CSV import
    const handleCSVImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            delimitersToGuess: [',', '\t', '|', ';'],
            complete: async (results) => {
                const rows = results.data;
                // CSV data parsed successfully

                if (!rows || rows.length === 0) {
                    showNotification(t('csv_empty_or_unreadable') || 'CSV file is empty or could not be parsed.', 'warning');
                    setIsImporting(false);
                    return;
                }

                // Map CSV columns to contact fields
                const mappedContacts = rows.map(row => {
                    // Normalize headers (remove spaces, convert to lowercase)
                    const normalizedRow = {};
                    Object.keys(row).forEach(key => {
                        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                        normalizedRow[normalizedKey] = row[key];
                    });

                    return {
                        first_name: normalizedRow.first_name || normalizedRow.firstname || normalizedRow.name || '',
                        last_name: normalizedRow.last_name || normalizedRow.lastname || normalizedRow.surname || '',
                        email: normalizedRow.email || '',
                        phone_number: normalizedRow.phone_number || normalizedRow.phone || normalizedRow.mobile || '',
                        company: normalizedRow.company || normalizedRow.organization || '',
                        job_title: normalizedRow.job_title || normalizedRow.title || normalizedRow.position || '',
                        notes: normalizedRow.notes || normalizedRow.comments || ''
                    };
                }).filter(contact => contact.first_name); // Only include contacts with a first name

                if (mappedContacts.length === 0) {
                    showNotification(t('no_valid_contacts_in_csv') || 'No valid contacts found in the CSV file. Please check the column headers.', 'warning');
                    setIsImporting(false);
                    return;
                }

                try {
                    const response = await contactApi.importBatch(mappedContacts, accessToken);
                    showNotification(response.message, 'success');
                    fetchAllData();
                } catch (err) {
                    console.error("Error importing contacts:", err);
                    showNotification(err.message || 'Failed to import contacts.', 'error');
                } finally {
                    setIsImporting(false);
                }
            },
            error: (err) => {
                console.error("PapaParse error:", err);
                showNotification(`CSV parsing error: ${err.message}`, 'error');
                setIsImporting(false);
            }
        });
        event.target.value = null; 
    };

    // Handle form submission
    const handleFormSubmit = async (contactData) => {
        try {
            if (editingContact) {
                await contactApi.update(editingContact.id, contactData, accessToken);
                showNotification(t('contact_updated_success') || 'Contact updated successfully!', 'success');
            } else {
                await contactApi.create(contactData, accessToken);
                showNotification(t('contact_created_success') || 'Contact created successfully!', 'success');
            }
            setIsFormOpen(false);
            setEditingContact(null);
            fetchAllData();
        } catch (err) {
            showNotification(err.message, 'error');
        }
    };

    // Handle edit
    const handleEdit = (contact) => {
        setEditingContact(contact);
        setIsFormOpen(true);
    };

    // Handle delete
    const handleDelete = async (contactId) => {
        if (window.confirm(t('confirm_delete_contact') || 'Are you sure you want to delete this contact?')) {
            try {
                await contactApi.delete(contactId, accessToken);
                showNotification(t('contact_deleted_success') || 'Contact deleted successfully!', 'success');
                fetchAllData();
            } catch (err) {
                showNotification(err.message, 'error');
            }
        }
    };

    // Handle add to daily calls
    const handleAddToDailyList = async (contactId) => {
        try {
            await dailyCallApi.addToDailyList(contactId, accessToken);
            showNotification(t('contact_added_to_daily_list') || 'Contact added to daily list!', 'success');
            fetchAllData();
        } catch (err) {
            showNotification(err.message || t('failed_to_add_to_daily_list'), 'error');
        }
    };

    // Handle remove from daily calls
    const handleRemoveFromDailyList = async (dailyCallId) => {
        if (window.confirm(t('confirm_remove_from_daily_list') || 'Are you sure you want to remove this contact from the daily list?')) {
            try {
                await dailyCallApi.removeFromDailyList(dailyCallId, accessToken);
                showNotification(t('call_removed_success') || 'Contact removed from daily list.', 'success');
                fetchAllData();
            } catch (err) {
                showNotification(err.message, 'error');
            }
        }
    };

    // Handle update daily call
    const handleUpdateDailyCall = async (dailyCallId, updateData) => {
        try {
            await dailyCallApi.updateDailyCall(dailyCallId, updateData, accessToken);
            showNotification(t('call_updated_success') || 'Daily call updated successfully.', 'success');
            fetchAllData();
        } catch (err) {
            showNotification(err.message || t('failed_to_update_call'), 'error');
        }
    };

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
            contact.first_name?.toLowerCase().includes(searchLower) ||
            contact.last_name?.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.company?.toLowerCase().includes(searchLower) ||
            contact.phone_number?.includes(searchTerm)
        );
    });

    // Check if contact is in daily list
    const isContactInDailyList = (contactId) => {
        return dailyCalls.some(call => call.contact_id === contactId);
    };

    // Render all contacts view
    const renderAllContactsView = () => (
        <div className="contact-list">
            {filteredContacts.length > 0 ? (
                <div className="contact-grid">
                    {filteredContacts.map(contact => (
                        <div key={contact.id} className="contact-card">
                            <div className="contact-header">
                                <h3>{contact.first_name} {contact.last_name}</h3>
                                <div className="contact-actions">
                                    <button onClick={() => handleEdit(contact)} className="edit-btn">
                                        {t('edit')}
                                    </button>
                                    <button onClick={() => handleDelete(contact.id)} className="delete-btn">
                                        {t('delete')}
                                    </button>
                                    {!isContactInDailyList(contact.id) ? (
                                        <button 
                                            onClick={() => handleAddToDailyList(contact.id)} 
                                            className="add-to-daily-btn"
                                        >
                                            + {t('daily_calls')}
                                        </button>
                                    ) : (
                                        <span className="daily-indicator">{t('on_daily_list') || 'On Daily List'}</span>
                                    )}
                                </div>
                            </div>
                            <div className="contact-details">
                                {contact.email && <p><strong>{t('email')}:</strong> {contact.email}</p>}
                                {contact.phone_number && <p><strong>{t('phone_number')}:</strong> {contact.phone_number}</p>}
                                {contact.company && <p><strong>{t('company')}:</strong> {contact.company}</p>}
                                {contact.job_title && <p><strong>{t('job_title')}:</strong> {contact.job_title}</p>}
                                {contact.notes && <p><strong>{t('notes')}:</strong> {contact.notes}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-contacts">{t('no_contacts_found') || 'No contacts found.'}</p>
            )}
        </div>
    );

    // Render daily calls view
    const renderDailyCallsView = () => (
        <div className="daily-calls-list">
            {dailyCalls.length > 0 ? (
                <div className="daily-calls-grid">
                    {dailyCalls.map(dailyCall => (
                        <div key={dailyCall.id} className="daily-call-card">
                            <div className="daily-call-header">
                                <h3>{dailyCall.contact.first_name} {dailyCall.contact.last_name}</h3>
                                <button 
                                    onClick={() => handleRemoveFromDailyList(dailyCall.id)} 
                                    className="remove-btn"
                                >
                                    {t('remove')}
                                </button>
                            </div>
                            <div className="daily-call-details">
                                <p><strong>{t('contact_name')}:</strong> {dailyCall.contact.first_name} {dailyCall.contact.last_name}</p>
                                {dailyCall.contact.phone_number && (
                                    <p><strong>{t('phone_number')}:</strong> {dailyCall.contact.phone_number}</p>
                                )}
                                {dailyCall.contact.company && (
                                    <p><strong>{t('company')}:</strong> {dailyCall.contact.company}</p>
                                )}
                                <div className="daily-call-settings">
                                    <label>
                                        <strong>{t('calls_per_day')}:</strong>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={dailyCall.call_frequency_per_day}
                                            onChange={(e) => handleUpdateDailyCall(dailyCall.id, {
                                                call_frequency_per_day: parseInt(e.target.value)
                                            })}
                                        />
                                    </label>
                                    <label>
                                        <strong>{t('next_call_at')}:</strong>
                                        <input
                                            type="datetime-local"
                                            value={dailyCall.next_call_at ? new Date(dailyCall.next_call_at).toISOString().slice(0, 16) : ''}
                                            onChange={(e) => handleUpdateDailyCall(dailyCall.id, {
                                                next_call_at: e.target.value ? new Date(e.target.value).toISOString() : null
                                            })}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="no-daily-calls">{t('no_contacts_in_daily_list') || 'No contacts have been added to the daily call list.'}</p>
            )}
        </div>
    );

    if (loading) {
        return <div className="loading-spinner">{t('loading') || 'Loading...'}</div>;
    }

    return (
        <div className="contacts-container">
            <div className="contacts-header">
                <h1>{t('my_contacts') || 'My Contacts'}</h1>
                <div className="contacts-actions">
                    <button 
                        onClick={() => {
                            setEditingContact(null);
                            setIsFormOpen(true);
                        }} 
                        className="add-contact-btn"
                    >
                        + {t('add_new_contact') || 'Add New Contact'}
                    </button>
                    <label htmlFor="csv-upload" className="csv-upload-btn">
                        {isImporting ? t('importing') || 'Importing...' : t('import_from_csv') || 'Import from CSV'}
                    </label>
                    <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleCSVImport}
                        disabled={isImporting}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div className="contacts-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    {t('all_contacts') || 'All Contacts'} ({contacts.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    {t('daily_calls') || 'Daily Calls'} ({dailyCalls.length})
                </button>
            </div>

            {activeTab === 'all' && (
                <div className="search-section">
                    <input
                        type="text"
                        placeholder={t('search_contacts') || 'Search contacts...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            )}

            <div className="contacts-content">
                {activeTab === 'all' ? renderAllContactsView() : renderDailyCallsView()}
            </div>

            {isFormOpen && (
                <ContactForm
                    existingContact={editingContact}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingContact(null);
                    }}
                />
            )}
        </div>
    );
}

export default ContactsPage;