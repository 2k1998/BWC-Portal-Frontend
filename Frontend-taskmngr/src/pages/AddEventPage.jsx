// src/pages/AddEventPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { eventApi } from '../api/apiService';
import DatePicker from 'react-datepicker';
import './Auth.css';

function AddEventPage() {
    const { accessToken } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [eventDate, setEventDate] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !location || !eventDate) {
            showNotification(t('event_required_fields'), 'error');
            return;
        }
        setLoading(true);
        try {
            await eventApi.createEvent(
                { title, description, location, event_date: eventDate.toISOString() },
                accessToken
            );
            showNotification(t('event_created_success'), 'success');
            navigate('/events');
        } catch (err) {
            showNotification(err.message || t('failed_to_create_event'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{t('create_new_event_title')}</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label htmlFor="title">{t('event_title')}:</label>
                    <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="location">{t('location')}:</label>
                    <input id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>{t('event_date_time')}:</label>
                    <DatePicker 
                        selected={eventDate} 
                        onChange={date => setEventDate(date)} 
                        showTimeInput
                        timeInputLabel="Time:"
                        dateFormat="dd/MM/yyyy HH:mm"
                        className="custom-datepicker-input" 
                        placeholderText={t('select_event_date_time')} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">{t('description_optional')}:</label>
                    <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows="4" />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? t('creating_event') : t('create_event')}
                </button>
            </form>
        </div>
    );
}

export default AddEventPage;